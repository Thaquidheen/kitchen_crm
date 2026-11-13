package com.fleetmanagement.kitchencrmbackend.modules.permission.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.Role;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.modules.permission.Permission;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.MyPermissionsDto;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.PermissionMatrixDto;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.PermissionMatrixDto.ModuleDto;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.PermissionMatrixDto.PermissionDto;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.PermissionMatrixDto.StaffTypeDto;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.PersonPermissions;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.PersonSummary;
import com.fleetmanagement.kitchencrmbackend.modules.permission.entity.StaffTypePermission;
import com.fleetmanagement.kitchencrmbackend.modules.permission.entity.UserPermission;
import com.fleetmanagement.kitchencrmbackend.modules.permission.repository.StaffTypePermissionRepository;
import com.fleetmanagement.kitchencrmbackend.modules.permission.repository.UserPermissionRepository;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import com.fleetmanagement.kitchencrmbackend.security.ViewerScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class PermissionServiceImpl implements PermissionService {

    /** Staff whose type is not set are their own group, so they are never left without rules. */
    public static final String NO_TYPE = "NONE";

    /** Staff types in the order the page shows them, with their names. */
    private static final Map<String, String> STAFF_TYPES = new LinkedHashMap<>();

    static {
        STAFF_TYPES.put("ADMIN_STAFF", "Admin staff");
        STAFF_TYPES.put("DESIGNER", "Designer");
        STAFF_TYPES.put("SALES", "Sales");
        STAFF_TYPES.put(NO_TYPE, "Type not set");
    }

    @Autowired
    private StaffTypePermissionRepository repository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserPermissionRepository userPermissionRepository;

    /**
     * staff type -> permission key -> allowed, for what the administrator decided. Read on almost
     * every request, changed a few times a year: kept in memory and dropped whenever it is saved.
     */
    private volatile Map<String, Map<String, Boolean>> decided;

    /**
     * The memory copies are not kept for longer than this. A request that started reading before a
     * save committed can load the old rows after the save dropped the copy, and would otherwise put
     * them back for good (a person just limited to Designs would keep everything until a restart).
     * Half a minute bounds that; the screens re-read the answers every minute anyway.
     */
    private static final long CACHE_NANOS = 30_000_000_000L;
    /** Moved on by every committed change; a copy loaded across a change is used once, not kept. */
    private final AtomicLong generation = new AtomicLong();
    private volatile long decidedAt;
    private volatile long overridesAt;

    private Map<String, Map<String, Boolean>> load() {
        Map<String, Map<String, Boolean>> loaded = new HashMap<>();
        for (StaffTypePermission row : repository.findAll()) {
            loaded.computeIfAbsent(row.getStaffType(), k -> new HashMap<>())
                    .put(row.getPermissionKey(), Boolean.TRUE.equals(row.getAllowed()));
        }
        return loaded;
    }

    private Map<String, Map<String, Boolean>> decided() {
        Map<String, Map<String, Boolean>> current = decided;
        if (current == null || System.nanoTime() - decidedAt > CACHE_NANOS) {
            long before = generation.get();
            current = load();
            if (generation.get() == before) {
                decidedAt = System.nanoTime();
                decided = current;
            }
        }
        return current;
    }

    /**
     * user id -> permission key -> allowed, for what the administrator set for one person. Kept in
     * memory like {@link #decided} and for the same reason; it holds a handful of rows.
     */
    private volatile Map<Long, Map<String, Boolean>> overrides;

    private Map<Long, Map<String, Boolean>> loadOverrides() {
        Map<Long, Map<String, Boolean>> loaded = new HashMap<>();
        for (UserPermission row : userPermissionRepository.findAll()) {
            loaded.computeIfAbsent(row.getUserId(), k -> new HashMap<>())
                    .put(row.getPermissionKey(), Boolean.TRUE.equals(row.getAllowed()));
        }
        return loaded;
    }

    private Map<Long, Map<String, Boolean>> overrides() {
        Map<Long, Map<String, Boolean>> current = overrides;
        if (current == null || System.nanoTime() - overridesAt > CACHE_NANOS) {
            long before = generation.get();
            current = loadOverrides();
            if (generation.get() == before) {
                overridesAt = System.nanoTime();
                overrides = current;
            }
        }
        return current;
    }

    /** What is set for this one person; nothing for an account that is gone. */
    private static Map<String, Boolean> personal(Map<Long, Map<String, Boolean>> overrides, User user) {
        return user == null || user.getId() == null ? Map.of() : overrides.getOrDefault(user.getId(), Map.of());
    }

    /** What the switch itself says for this staff type, before anything it depends on. */
    private static boolean switchedOn(Map<String, Map<String, Boolean>> decided, String staffType, Permission permission) {
        if (!permission.appliesTo(staffType)) {
            return false;
        }
        Boolean answer = decided.getOrDefault(staffType, Map.of()).get(permission.key());
        return answer != null ? answer : permission.defaultAllowed();
    }

    /**
     * What the switch says for one person: what was set for them, otherwise their staff type's. A
     * permission that does not apply to their type stays off whatever was set for them: that row is
     * left over from an earlier type and counts again if they get that type back.
     */
    private static boolean switchedOn(Map<String, Map<String, Boolean>> decided, Map<String, Boolean> personal,
                                      String staffType, Permission permission) {
        if (!permission.appliesTo(staffType)) {
            return false;
        }
        Boolean own = personal.get(permission.key());
        return own != null ? own : switchedOn(decided, staffType, permission);
    }

    /**
     * Whether the person really has it: their own switch, and the one it only works together with.
     * With nothing set for them ({@code personal} empty) this is exactly what their staff type has.
     */
    private static boolean allowed(Map<String, Map<String, Boolean>> decided, Map<String, Boolean> personal,
                                   String staffType, Permission permission) {
        if (!switchedOn(decided, personal, staffType, permission)) {
            return false;
        }
        Permission required = permission.requires();
        return required == null || allowed(decided, personal, staffType, required);
    }

    /**
     * After a change: what this transaction wrote is used at once, and once it has committed the
     * memory copy is dropped again — another request may have reloaded the old rows in between.
     */
    private Map<String, Map<String, Boolean>> refreshAfterChange() {
        repository.flush();
        Map<String, Map<String, Boolean>> fresh = load();
        decidedAt = System.nanoTime();
        decided = fresh;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    generation.incrementAndGet();
                    decided = null;
                }
            });
        }
        return fresh;
    }

    /** The same as {@link #refreshAfterChange()}, for what is set per person. */
    private Map<Long, Map<String, Boolean>> refreshOverridesAfterChange() {
        userPermissionRepository.flush();
        Map<Long, Map<String, Boolean>> fresh = loadOverrides();
        overridesAt = System.nanoTime();
        overrides = fresh;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    generation.incrementAndGet();
                    overrides = null;
                }
            });
        }
        return fresh;
    }

    private static String typeOf(User user) {
        String type = user == null ? null : user.getStaffType();
        return type != null && STAFF_TYPES.containsKey(type) ? type : NO_TYPE;
    }

    /** The account behind the signed-in person, read fresh so a changed staff type counts at once. */
    private User accountOf(UserPrincipal user) {
        return user.getId() == null ? null : userRepository.findById(user.getId()).orElse(null);
    }

    private static boolean isSuperAdmin(User user) {
        return user.getRoles() != null
                && user.getRoles().stream().anyMatch(r -> r.getName() == Role.RoleName.ROLE_SUPER_ADMIN);
    }

    // ------------------------------------------------------------------ asking

    @Override
    @Transactional(readOnly = true)
    public boolean can(UserPrincipal user, Permission permission) {
        if (user == null) {
            return false;
        }
        if (ViewerScope.isSuperAdmin(user)) {
            return true;
        }
        User account = accountOf(user);
        return allowed(decided(), personal(overrides(), account), typeOf(account), permission);
    }

    @Override
    @Transactional(readOnly = true)
    public MyPermissionsDto mine(UserPrincipal user) {
        MyPermissionsDto dto = new MyPermissionsDto();
        boolean superAdmin = ViewerScope.isSuperAdmin(user);
        dto.setSuperAdmin(superAdmin);
        User account = superAdmin || user == null ? null : accountOf(user);
        String type = superAdmin || user == null ? null : typeOf(account);
        dto.setStaffType(type);
        Map<String, Map<String, Boolean>> decided = decided();
        Map<String, Boolean> personal = personal(overrides(), account);
        for (Permission p : Permission.values()) {
            dto.getPermissions().put(p.key(), superAdmin || (type != null && allowed(decided, personal, type, p)));
        }
        return dto;
    }

    // ------------------------------------------------------------------ the administrator's page

    @Override
    @Transactional(readOnly = true)
    public PermissionMatrixDto matrix() {
        return matrix(decided());
    }

    private PermissionMatrixDto matrix(Map<String, Map<String, Boolean>> decided) {
        PermissionMatrixDto dto = new PermissionMatrixDto();

        Map<String, Integer> users = new HashMap<>();
        for (User u : userRepository.findAll()) {
            if (!isSuperAdmin(u) && !Boolean.FALSE.equals(u.getActive())) {
                users.merge(typeOf(u), 1, Integer::sum);
            }
        }
        STAFF_TYPES.forEach((key, label) -> dto.getStaffTypes().add(new StaffTypeDto(key, label, users.getOrDefault(key, 0))));

        dto.setModules(modules());

        for (String type : STAFF_TYPES.keySet()) {
            Map<String, Boolean> row = new LinkedHashMap<>();
            // The switches as they are set: a switch whose required permission is off keeps its own
            // answer, so turning the required one back on brings back what was there.
            for (Permission p : Permission.values()) {
                row.put(p.key(), switchedOn(decided, type, p));
            }
            dto.getValues().put(type, row);
        }
        return dto;
    }

    /** The catalogue grouped by module, as both views of the page show it. */
    private static List<ModuleDto> modules() {
        Map<String, List<PermissionDto>> byModule = new LinkedHashMap<>();
        for (Permission p : Permission.values()) {
            byModule.computeIfAbsent(p.module(), k -> new ArrayList<>())
                    .add(new PermissionDto(p.key(), p.label(), p.description(), p.defaultAllowed(), p.screenOnly(),
                            p.requires() == null ? null : p.requires().key(),
                            p.appliesToTypes() == null ? null : STAFF_TYPES.keySet().stream()
                                    .filter(p::appliesTo).toList()));
        }
        List<ModuleDto> modules = new ArrayList<>();
        byModule.forEach((name, permissions) -> modules.add(new ModuleDto(name, permissions)));
        return modules;
    }

    @Override
    @Transactional
    public ApiResponse<PermissionMatrixDto> save(Map<String, Map<String, Boolean>> values, UserPrincipal by) {
        if (values == null || values.isEmpty()) {
            return ApiResponse.error("Nothing to save");
        }
        // Check everything first, so a bad entry leaves the rest untouched.
        for (Map.Entry<String, Map<String, Boolean>> type : values.entrySet()) {
            if (!STAFF_TYPES.containsKey(type.getKey())) {
                return ApiResponse.error("Unknown staff type: " + type.getKey());
            }
            if (type.getValue() == null) {
                continue;
            }
            for (Map.Entry<String, Boolean> answer : type.getValue().entrySet()) {
                Permission permission = Permission.byKey(answer.getKey());
                if (permission == null) {
                    return ApiResponse.error("Unknown permission: " + answer.getKey());
                }
                if (!permission.appliesTo(type.getKey())) {
                    return ApiResponse.error(permission.label() + " is not something " + STAFF_TYPES.get(type.getKey())
                            + " can be given");
                }
                if (answer.getValue() == null) {
                    return ApiResponse.error("Say yes or no for " + answer.getKey());
                }
            }
        }
        LocalDateTime now = LocalDateTime.now();
        for (Map.Entry<String, Map<String, Boolean>> type : values.entrySet()) {
            if (type.getValue() == null) {
                continue;
            }
            Map<String, StaffTypePermission> existing = new HashMap<>();
            for (StaffTypePermission row : repository.findByStaffType(type.getKey())) {
                existing.put(row.getPermissionKey(), row);
            }
            for (Map.Entry<String, Boolean> answer : type.getValue().entrySet()) {
                StaffTypePermission row = existing.get(answer.getKey());
                if (row == null) {
                    row = new StaffTypePermission();
                    row.setStaffType(type.getKey());
                    row.setPermissionKey(answer.getKey());
                }
                row.setAllowed(answer.getValue());
                row.setUpdatedByUserId(by != null ? by.getId() : null);
                row.setUpdatedByName(by != null ? by.getName() : null);
                row.setUpdatedAt(now);
                repository.save(row);
            }
        }
        return ApiResponse.success("Permissions saved", matrix(refreshAfterChange()));
    }

    // ------------------------------------------------------------------ one person

    @Override
    @Transactional(readOnly = true)
    public List<PersonSummary> people() {
        Map<Long, Map<String, Boolean>> all = overrides();
        List<PersonSummary> people = new ArrayList<>();
        for (User u : userRepository.findAll()) {
            if (isSuperAdmin(u)) {
                continue;
            }
            String type = typeOf(u);
            // Only what still counts: a row left over from an earlier staff type changes nothing.
            int set = 0;
            for (String key : personal(all, u).keySet()) {
                Permission p = Permission.byKey(key);
                if (p != null && p.appliesTo(type)) {
                    set++;
                }
            }
            people.add(new PersonSummary(u.getId(), u.getName(), u.getEmail(), type, STAFF_TYPES.get(type),
                    !Boolean.FALSE.equals(u.getActive()), set));
        }
        people.sort(Comparator.comparing((PersonSummary s) -> !s.getActive())
                .thenComparing(s -> s.getName() == null ? "" : s.getName(), String.CASE_INSENSITIVE_ORDER));
        return people;
    }

    /** Why there is nothing to set for this account, or null when there is. */
    private static String refusal(User user) {
        if (user == null) {
            return "Staff member not found";
        }
        if (isSuperAdmin(user)) {
            return user.getName() + " is an administrator and always has every permission";
        }
        return null;
    }

    private User account(Long userId) {
        return userId == null ? null : userRepository.findById(userId).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<PersonPermissions> person(Long userId) {
        User user = account(userId);
        String refusal = refusal(user);
        if (refusal != null) {
            return ApiResponse.error(refusal);
        }
        return ApiResponse.success(person(user, decided(), overrides()));
    }

    private static PersonPermissions person(User user, Map<String, Map<String, Boolean>> decided,
                                            Map<Long, Map<String, Boolean>> overrides) {
        String type = typeOf(user);
        Map<String, Boolean> personal = personal(overrides, user);
        PersonPermissions dto = new PersonPermissions();
        dto.setUserId(user.getId());
        dto.setName(user.getName());
        dto.setStaffType(type);
        dto.setStaffTypeLabel(STAFF_TYPES.get(type));
        dto.setActive(!Boolean.FALSE.equals(user.getActive()));
        dto.setModules(modules());
        for (Permission p : Permission.values()) {
            // The staff type's switch as it is set, like the staff type table shows it.
            dto.getTypeValues().put(p.key(), switchedOn(decided, type, p));
            Boolean own = personal.get(p.key());
            if (own != null && p.appliesTo(type)) {
                dto.getOverrides().put(p.key(), own);
            }
            dto.getEffective().put(p.key(), allowed(decided, personal, type, p));
        }
        return dto;
    }

    @Override
    @Transactional
    public ApiResponse<PersonPermissions> savePerson(Long userId, Map<String, Boolean> values, UserPrincipal by) {
        if (values == null || values.isEmpty()) {
            return ApiResponse.error("Nothing to save");
        }
        User user = account(userId);
        String refusal = refusal(user);
        if (refusal != null) {
            return ApiResponse.error(refusal);
        }
        String type = typeOf(user);
        // Check everything first, so a bad entry leaves the rest untouched.
        for (Map.Entry<String, Boolean> answer : values.entrySet()) {
            Permission permission = Permission.byKey(answer.getKey());
            if (permission == null) {
                return ApiResponse.error("Unknown permission: " + answer.getKey());
            }
            // Going back to the staff type (null) is always fine, even for a row left over from an
            // earlier staff type; giving or refusing something the type cannot have is not.
            if (answer.getValue() != null && !permission.appliesTo(type)) {
                return ApiResponse.error(permission.label() + " is not something " + STAFF_TYPES.get(type)
                        + " can be given, so it cannot be set for " + user.getName());
            }
        }
        Map<String, UserPermission> existing = new HashMap<>();
        for (UserPermission row : userPermissionRepository.findByUserId(user.getId())) {
            existing.put(row.getPermissionKey(), row);
        }
        LocalDateTime now = LocalDateTime.now();
        for (Map.Entry<String, Boolean> answer : values.entrySet()) {
            UserPermission row = existing.get(answer.getKey());
            if (answer.getValue() == null) {
                if (row != null) {
                    userPermissionRepository.delete(row);
                }
                continue;
            }
            if (row == null) {
                row = new UserPermission();
                row.setUserId(user.getId());
                row.setPermissionKey(answer.getKey());
            }
            row.setAllowed(answer.getValue());
            row.setUpdatedByUserId(by != null ? by.getId() : null);
            row.setUpdatedByName(by != null ? by.getName() : null);
            row.setUpdatedAt(now);
            userPermissionRepository.save(row);
        }
        return ApiResponse.success("Permissions saved for " + user.getName(),
                person(user, decided(), refreshOverridesAfterChange()));
    }

    @Override
    @Transactional
    public ApiResponse<PersonPermissions> resetPerson(Long userId) {
        User user = account(userId);
        String refusal = refusal(user);
        if (refusal != null) {
            return ApiResponse.error(refusal);
        }
        userPermissionRepository.deleteAll(userPermissionRepository.findByUserId(user.getId()));
        return ApiResponse.success(user.getName() + " has the " + STAFF_TYPES.get(typeOf(user))
                        + " permissions again", person(user, decided(), refreshOverridesAfterChange()));
    }
}
