package com.fleetmanagement.kitchencrmbackend.modules.audit.controller;

import com.fleetmanagement.kitchencrmbackend.modules.audit.dto.ActivityLogDto;
import com.fleetmanagement.kitchencrmbackend.modules.audit.dto.LoginSummaryDto;
import com.fleetmanagement.kitchencrmbackend.modules.audit.service.ActivityLogService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Settings > Activity Log. Strictly SUPER_ADMIN: this is the who-did-what-from-where record,
 * including failed sign-in attempts with source IPs.
 */
@RestController
@RequestMapping("/api/v1/activity-logs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ActivityLogController {

    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<ActivityLogDto>>> getLogs(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(activityLogService.getLogs(eventType, module, actor, fromDate, toDate, page, size));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        return ResponseEntity.ok(activityLogService.getStats(module, actor, fromDate, toDate));
    }

    @GetMapping("/login-summary")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<LoginSummaryDto>>> getLoginSummary() {
        return ResponseEntity.ok(activityLogService.getLoginSummary());
    }
}
