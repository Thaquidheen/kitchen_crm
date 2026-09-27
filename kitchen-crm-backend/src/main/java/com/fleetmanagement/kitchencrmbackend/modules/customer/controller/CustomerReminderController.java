package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerReminderDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.CustomerReminderService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import com.fleetmanagement.kitchencrmbackend.security.ViewerScope;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Reminders are private to whoever created them: a staff member sees only their own, a super
 * admin sees everything and may narrow to one person with {@code createdByUserId}.
 *
 * <p>Every endpoint here — including the bell feed and the chip counts — resolves a
 * {@link ViewerScope} and hands it to the service, so the numbers on the chips always describe
 * the same rows the list returns. The scope is derived from the authenticated principal, never
 * from a request parameter, so a staff member cannot widen their own view.
 */
@RestController
@RequestMapping("/api/v1/reminders")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CustomerReminderController {

    @Autowired
    private CustomerReminderService reminderService;

    @PostMapping
    public ResponseEntity<ApiResponse<CustomerReminderDto>> createReminder(
            @Valid @RequestBody CustomerReminderDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reminderService.createReminder(
                dto,
                currentUser != null ? currentUser.getName() : null,
                currentUser != null ? currentUser.getId() : null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerReminderDto>> updateReminder(
            @PathVariable Long id,
            @RequestBody CustomerReminderDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reminderService.updateReminder(id, dto, ViewerScope.of(currentUser)));
    }

    @PatchMapping("/{id}/done")
    public ResponseEntity<ApiResponse<String>> markDone(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reminderService.markDone(id, ViewerScope.of(currentUser)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteReminder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reminderService.deleteReminder(id, ViewerScope.of(currentUser)));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<CustomerReminderDto>>> getRemindersForCustomer(
            @PathVariable Long customerId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reminderService.getRemindersForCustomer(customerId, ViewerScope.of(currentUser)));
    }

    @GetMapping("/appliance/{applianceCustomerId}")
    public ResponseEntity<ApiResponse<List<CustomerReminderDto>>> getRemindersForApplianceCustomer(
            @PathVariable Long applianceCustomerId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reminderService.getRemindersForApplianceCustomer(
                applianceCustomerId, ViewerScope.of(currentUser)));
    }

    @GetMapping("/open")
    public ResponseEntity<ApiResponse<List<CustomerReminderDto>>> getOpenReminders(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reminderService.getOpenReminders(ViewerScope.of(currentUser)));
    }

    // Header bell feed: currently-due reminders + count
    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNotifications(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reminderService.getNotifications(ViewerScope.of(currentUser)));
    }

    /**
     * Reminders page: cross-customer list, filtered by day bucket. {@code createdByUserId} is the
     * super admin's "show me only this staff member's reminders" filter; ViewerScope ignores it for
     * anyone else.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CustomerReminderDto>>> getReminders(
            @RequestParam(defaultValue = "ALL") String bucket,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) Long createdByUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reminderService.getReminders(
                bucket, search, source, page, size, ViewerScope.of(currentUser, createdByUserId)));
    }

    // Reminders page: counts for the filter chips — same scope as the list above, or they disagree.
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getReminderStats(
            @RequestParam(required = false) Long createdByUserId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reminderService.getReminderStats(
                ViewerScope.of(currentUser, createdByUserId)));
    }
}
