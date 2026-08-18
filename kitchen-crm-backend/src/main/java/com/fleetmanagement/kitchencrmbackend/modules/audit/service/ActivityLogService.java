package com.fleetmanagement.kitchencrmbackend.modules.audit.service;

import com.fleetmanagement.kitchencrmbackend.modules.audit.dto.ActivityLogDto;
import com.fleetmanagement.kitchencrmbackend.modules.audit.dto.LoginSummaryDto;
import com.fleetmanagement.kitchencrmbackend.modules.audit.entity.ActivityLog;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;

public interface ActivityLogService {

    /**
     * Records one audit event. MUST never throw and never participate in the caller's
     * transaction — auditing must not be able to break or roll back the action it observes.
     */
    void record(ActivityLog.EventType eventType, String actorEmail, String actorName,
                String actorRole, String module, String httpMethod, String summary,
                Integer statusCode, String ipAddress, String userAgent);

    ApiResponse<Page<ActivityLogDto>> getLogs(String eventType, String module, String actor,
                                              String fromDate, String toDate, int page, int size);

    /**
     * Chip counts + the module picker's options, scoped by the same module/actor/date filters the
     * table is using so the two cannot contradict each other. eventType is not applied: each chip
     * reports what it would select.
     */
    ApiResponse<Map<String, Object>> getStats(String module, String actor,
                                              String fromDate, String toDate);

    /** Per-user sign-in summary: last login, count, distinct IPs (with the recent IP list). */
    ApiResponse<List<LoginSummaryDto>> getLoginSummary();
}
