package com.fleetmanagement.kitchencrmbackend.modules.audit.service;

import com.fleetmanagement.kitchencrmbackend.modules.audit.dto.ActivityLogDto;
import com.fleetmanagement.kitchencrmbackend.modules.audit.dto.LoginSummaryDto;
import com.fleetmanagement.kitchencrmbackend.modules.audit.entity.ActivityLog;
import com.fleetmanagement.kitchencrmbackend.modules.audit.repository.ActivityLogRepository;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ActivityLogServiceImpl implements ActivityLogService {

    private static final Logger logger = LoggerFactory.getLogger(ActivityLogServiceImpl.class);

    // Wide open-bound sentinels, matching the reminders convention (no nullable date params).
    private static final LocalDateTime MIN_BOUND = LocalDateTime.of(2000, 1, 1, 0, 0);
    private static final LocalDateTime MAX_BOUND = LocalDateTime.of(2100, 1, 1, 0, 0);
    private static final int MAX_IPS_PER_USER = 8;
    /** The sign-in cards are a glance surface, not a directory; the table is the full record. */
    private static final int MAX_USERS_IN_SUMMARY = 100;

    /**
     * The team's clock. The JVM runs in UTC (no TZ on the container), so anything derived from a
     * bare now() is 5h30m behind the office. Reminders and todos already resolve "now" through this
     * property (CustomerReminderServiceImpl, AdminTodoServiceImpl); the audit log must too, both so
     * the viewer shows real local times and so a date picked in the filter means the same day the
     * rows were stamped in.
     */
    @Value("${app.business-timezone:Asia/Kolkata}")
    private String businessTimezone;

    @Autowired
    private ActivityLogRepository repository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogWriter writer;

    private ZoneId zone() {
        return ZoneId.of(businessTimezone);
    }

    /**
     * Builds the row and hands it to {@link ActivityLogWriter}, which persists it on a background
     * thread. Deliberately NOT @Transactional: the annotation's proxy begins the transaction
     * before the method body and commits after it, so a try/catch in here could not swallow a
     * begin failure (pool exhausted) or a commit failure (rollback-only after a failed INSERT) —
     * those escaped into the login path and turned a valid sign-in into a 500. The transaction now
     * lives in ActivityLogTxWriter, called with the catch wrapped around it.
     */
    @Override
    public void record(ActivityLog.EventType eventType, String actorEmail, String actorName,
                       String actorRole, String module, String httpMethod, String summary,
                       Integer statusCode, String ipAddress, String userAgent) {
        try {
            ActivityLog log = new ActivityLog();
            log.setCreatedAt(LocalDateTime.now(zone()));
            log.setEventType(eventType);
            log.setActorEmail(trim(actorEmail, 255));
            log.setActorName(trim(actorName, 255));
            log.setActorRole(trim(actorRole, 30));
            log.setModule(trim(module, 40));
            log.setHttpMethod(trim(httpMethod, 10));
            log.setSummary(trim(summary, 500));
            log.setStatusCode(statusCode);
            log.setIpAddress(trim(ipAddress, 50));
            log.setUserAgent(trim(userAgent, 300));
            writer.submit(log);
        } catch (Throwable t) {
            logger.warn("Activity log record failed ({} {}): {}", eventType, summary, t.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<Page<ActivityLogDto>> getLogs(String eventType, String module, String actor,
                                                     String fromDate, String toDate, int page, int size) {
        List<ActivityLog.EventType> types = parseTypes(eventType);
        Pageable pageable = PageRequest.of(Math.max(page, 0), size <= 0 ? 25 : Math.min(size, 200),
                Sort.by("createdAt").descending().and(Sort.by("id").descending()));
        Page<ActivityLogDto> result = repository
                .findByFilters(types, moduleFilter(module), actorLike(actor),
                        parseDate(fromDate, MIN_BOUND, false), parseDate(toDate, MAX_BOUND, true), pageable)
                .map(this::toDto);
        return ApiResponse.success(result);
    }

    /**
     * Counts use the same module/actor/date bounds as the page, so the chips agree with the table.
     * eventType is deliberately NOT applied — each chip shows how many rows it would select.
     */
    @Override
    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Object>> getStats(String module, String actor,
                                                     String fromDate, String toDate) {
        String actorLike = actorLike(actor);
        String mod = moduleFilter(module);
        LocalDateTime from = parseDate(fromDate, MIN_BOUND, false);
        LocalDateTime to = parseDate(toDate, MAX_BOUND, true);

        Map<String, Object> stats = new LinkedHashMap<>();
        long total = 0;
        Map<String, Long> byEvent = new LinkedHashMap<>();
        for (ActivityLog.EventType t : ActivityLog.EventType.values()) {
            byEvent.put(t.name(), 0L);
        }
        for (Object[] row : repository.countByEventType(mod, actorLike, from, to)) {
            long count = ((Number) row[1]).longValue();
            byEvent.put(((ActivityLog.EventType) row[0]).name(), count);
            total += count;
        }
        stats.put("total", total);
        stats.put("byEvent", byEvent);

        // The module picker lists every module present in the current scope, busiest first.
        Map<String, Long> byModule = new LinkedHashMap<>();
        for (Object[] row : repository.countByModule(actorLike, from, to)) {
            if (row[0] != null) {
                byModule.put((String) row[0], ((Number) row[1]).longValue());
            }
        }
        stats.put("byModule", byModule);
        return ApiResponse.success(stats);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<LoginSummaryDto>> getLoginSummary() {
        List<Object[]> rows = repository.loginSummaryByUser(ActivityLog.EventType.LOGIN,
                PageRequest.of(0, MAX_USERS_IN_SUMMARY));

        // Names come from the users table, not from the audit rows. MAX(actorName) over the group
        // returns the alphabetically largest name a user has ever had, so a corrected display name
        // would keep showing the old one forever, beside a genuinely-latest timestamp.
        List<String> emails = new ArrayList<>();
        for (Object[] row : rows) {
            emails.add((String) row[0]);
        }
        Map<String, String> currentNames = new HashMap<>();
        if (!emails.isEmpty()) {
            for (User u : userRepository.findByEmailIn(emails)) {
                currentNames.put(u.getEmail(), u.getName());
            }
        }

        List<LoginSummaryDto> out = new ArrayList<>();
        Pageable ipLimit = PageRequest.of(0, MAX_IPS_PER_USER);
        for (Object[] row : rows) {
            String email = (String) row[0];
            LoginSummaryDto dto = new LoginSummaryDto();
            dto.setEmail(email);
            dto.setName(currentNames.get(email)); // null for deleted users; the UI falls back to email
            dto.setLastLogin((LocalDateTime) row[1]);
            dto.setLoginCount(((Number) row[2]).longValue());
            dto.setDistinctIpCount(((Number) row[3]).longValue());
            List<String> ips = new ArrayList<>();
            for (Object[] ipRow : repository.recentLoginIps(ActivityLog.EventType.LOGIN, email, ipLimit)) {
                ips.add((String) ipRow[0]);
            }
            dto.setRecentIps(ips);
            out.add(dto);
        }
        return ApiResponse.success(out);
    }

    private String actorLike(String actor) {
        return (actor == null || actor.isBlank()) ? "%" : "%" + actor.trim().toLowerCase() + "%";
    }

    private String moduleFilter(String module) {
        return (module == null || module.isBlank()) ? null : module.trim().toLowerCase();
    }

    private List<ActivityLog.EventType> parseTypes(String eventType) {
        if (eventType != null && !eventType.isBlank()) {
            try {
                return List.of(ActivityLog.EventType.valueOf(eventType.trim().toUpperCase()));
            } catch (IllegalArgumentException ignored) {
                // unknown filter value: fall through to "all" rather than 500
            }
        }
        return List.of(ActivityLog.EventType.values());
    }

    /** yyyy-MM-dd; the to-bound is exclusive start-of-next-day so a single day filters cleanly. */
    private LocalDateTime parseDate(String value, LocalDateTime fallback, boolean endOfDay) {
        if (value == null || value.isBlank()) return fallback;
        try {
            LocalDate d = LocalDate.parse(value.trim());
            return endOfDay ? d.plusDays(1).atStartOfDay() : d.atStartOfDay();
        } catch (Exception e) {
            return fallback;
        }
    }

    private ActivityLogDto toDto(ActivityLog a) {
        return new ActivityLogDto(a.getId(), a.getEventType().name(), a.getActorEmail(),
                a.getActorName(), a.getActorRole(), a.getModule(), a.getHttpMethod(),
                a.getSummary(), a.getStatusCode(), a.getIpAddress(), a.getUserAgent(),
                a.getCreatedAt());
    }

    private String trim(String v, int max) {
        if (v == null || v.isBlank()) return null;
        String t = v.trim();
        return t.length() <= max ? t : t.substring(0, max);
    }
}
