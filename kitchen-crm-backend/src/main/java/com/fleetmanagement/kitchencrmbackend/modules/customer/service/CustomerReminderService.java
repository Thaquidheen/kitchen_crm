package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerReminderDto;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;

public interface CustomerReminderService {
    // Reminders are private to their creator: every read takes a viewer scope (ViewerScope.ALL
    // for a super admin, else the caller's user id) and every write checks ownership.
    ApiResponse<CustomerReminderDto> createReminder(CustomerReminderDto dto, String createdBy, Long createdByUserId);
    ApiResponse<CustomerReminderDto> updateReminder(Long id, CustomerReminderDto dto, long viewerId);
    ApiResponse<String> markDone(Long id, long viewerId);
    ApiResponse<String> deleteReminder(Long id, long viewerId);
    ApiResponse<List<CustomerReminderDto>> getRemindersForCustomer(Long customerId, long viewerId);
    ApiResponse<List<CustomerReminderDto>> getRemindersForApplianceCustomer(Long applianceCustomerId, long viewerId);
    ApiResponse<List<CustomerReminderDto>> getOpenReminders(long viewerId);
    // Bell feed: due (unacknowledged) reminders + count
    ApiResponse<Map<String, Object>> getNotifications(long viewerId);

    // Reminders page: cross-customer list filtered by day bucket (ALL/TODAY/OVERDUE/UPCOMING/DONE)
    ApiResponse<Page<CustomerReminderDto>> getReminders(String bucket, String search, String source, int page, int size, long viewerId);

    // Reminders page: counts per bucket for the filter chips
    ApiResponse<Map<String, Long>> getReminderStats(long viewerId);
}
