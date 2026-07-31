package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerReminderDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.CustomerReminderService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
        return ResponseEntity.ok(reminderService.createReminder(dto, currentUser != null ? currentUser.getName() : null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerReminderDto>> updateReminder(
            @PathVariable Long id,
            @RequestBody CustomerReminderDto dto) {
        return ResponseEntity.ok(reminderService.updateReminder(id, dto));
    }

    @PatchMapping("/{id}/done")
    public ResponseEntity<ApiResponse<String>> markDone(@PathVariable Long id) {
        return ResponseEntity.ok(reminderService.markDone(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteReminder(@PathVariable Long id) {
        return ResponseEntity.ok(reminderService.deleteReminder(id));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<CustomerReminderDto>>> getRemindersForCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(reminderService.getRemindersForCustomer(customerId));
    }

    @GetMapping("/appliance/{applianceCustomerId}")
    public ResponseEntity<ApiResponse<List<CustomerReminderDto>>> getRemindersForApplianceCustomer(
            @PathVariable Long applianceCustomerId) {
        return ResponseEntity.ok(reminderService.getRemindersForApplianceCustomer(applianceCustomerId));
    }

    @GetMapping("/open")
    public ResponseEntity<ApiResponse<List<CustomerReminderDto>>> getOpenReminders() {
        return ResponseEntity.ok(reminderService.getOpenReminders());
    }

    // Header bell feed: currently-due reminders + count
    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNotifications() {
        return ResponseEntity.ok(reminderService.getNotifications());
    }

    // Reminders page: cross-customer list, filtered by day bucket
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CustomerReminderDto>>> getReminders(
            @RequestParam(defaultValue = "ALL") String bucket,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(reminderService.getReminders(bucket, search, page, size));
    }

    // Reminders page: counts for the filter chips
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getReminderStats() {
        return ResponseEntity.ok(reminderService.getReminderStats());
    }
}
