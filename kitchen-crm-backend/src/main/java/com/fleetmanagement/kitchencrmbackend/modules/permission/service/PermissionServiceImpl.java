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
import com.fleetmanagement.kitchencrmbackend.modules.permission.entity.StaffTypePermission;
import com.fleetmanagement.kitchencrmbackend.modules.permission.repository.StaffTypePermissionRepository;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import com.fleetmanagement.kitchencrmbackend.security.ViewerScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    /**
     * staff type -> permission key -> allowed, for what the administrator decided. Read on almost
     * every request, changed a few times a year: kept in memory and dropped whenever it is saved.
     */
    private volatile Map<String, Map<String, Boolean>> decided;

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
        if (current == null) {
            current = load();
            decided = current;
        }
        return current;
    }

    private static boolean allowed(Map<String, Map<String, Boolean>> decided, String staffType, Permission permission) {
        Boolean answer = decided.getOrDefault(staffType, Map.of()).get(permission.key());
        return answer != null ? answer : permission.defaultAllowed();
    }

    private boolean allowed(String staffType, Permission permission) {
        return allowed(decided(), staffType, permission);
    }

    /**
     * After a change: what this transaction wrote is used at once, and once it has committed the
     * memory copy is dropped again — another request may have reloaded the old rows in between.
     */
    private Map<String, Map<String, Boolean>> refreshAfterChange() {
        repository.flush();
        Map<String, Map<String, Boolean>> fresh = load();
        decided = fresh;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    decided = null;
                }
            });
        }
        return fresh;
    }

    private static String typeOf(User user) {
        String type = user == null ? null : user.getStaffType();
        return type != null && STAFF_TYPES.containsKey(type) ? type : NO_TYPE;
    }

    private String staffTypeOf(UserPrincipal user) {
        return typeOf(user.getId() == null ? null : userRepository.findById(user.getId()).orElse(null));
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
        return allowed(staffTypeOf(user), permission);
    }

    @Override
    @Transactional(readOnly = true)
    public MyPermissionsDto mine(UserPrincipal user) {
        MyPermissionsDto dto = new MyPermissionsDto();
        boolean superAdmin = ViewerScope.isSuperAdmin(user);
        dto.setSuperAdmin(superAdmin);
        String type = superAdmin || user == null ? null : staffTypeOf(user);
        dto.setStaffType(type);
        for (Permission p : Permission.values()) {
            dto.getPermissions().put(p.key(), superAdmin || (type != null && allowed(type, p)));
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
            boolean superAdmin = u.getRoles() != null
                    && u.getRoles().stream().anyMatch(r -> r.getName() == Role.RoleName.ROLE_SUPER_ADMIN);
            if (!superAdmin && !Boolean.FALSE.equals(u.getActive())) {
                users.merge(typeOf(u), 1, Integer::sum);
            }
        }
        STAFF_TYPES.forEach((key, label) -> dto.getStaffTypes().add(new StaffTypeDto(key, label, users.getOrDefault(key, 0))));

        Map<String, List<PermissionDto>> byModule = new LinkedHashMap<>();
        for (Permission p : Permission.values()) {
            byModule.computeIfAbsent(p.module(), k -> new ArrayList<>())
                    .add(new PermissionDto(p.key(), p.label(), p.description(), p.defaultAllowed(), p.screenOnly()));
        }
        byModule.forEach((name, permissions) -> dto.getModules().add(new ModuleDto(name, permissions)));

        for (String type : STAFF_TYPES.keySet()) {
            Map<String, Boolean> row = new LinkedHashMap<>();
            for (Permission p : Permission.values()) {
                row.put(p.key(), allowed(decided, type, p));
            }
            dto.getValues().put(type, row);
        }
        return dto;
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
                if (Permission.byKey(answer.getKey()) == null) {
                    return ApiResponse.error("Unknown permission: " + answer.getKey());
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
}
