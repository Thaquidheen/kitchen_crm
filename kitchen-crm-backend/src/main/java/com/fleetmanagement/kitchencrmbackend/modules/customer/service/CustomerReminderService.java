package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerReminderDto;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;

public interface CustomerReminderService {
    ApiResponse<CustomerReminderDto> createReminder(CustomerReminderDto dto, String createdBy);
    ApiResponse<CustomerReminderDto> updateReminder(Long id, CustomerReminderDto dto);
    ApiResponse<String> markDone(Long id);
    ApiResponse<String> deleteReminder(Long id);
    ApiResponse<List<CustomerReminderDto>> getRemindersForCustomer(Long customerId);
    ApiResponse<List<CustomerReminderDto>> getRemindersForApplianceCustomer(Long applianceCustomerId);
    ApiResponse<List<CustomerReminderDto>> getOpenReminders();
    // Bell feed: due (unacknowledged) reminders + count
    ApiResponse<Map<String, Object>> getNotifications();

    // Reminders page: cross-customer list filtered by day bucket (ALL/TODAY/OVERDUE/UPCOMING/DONE)
    ApiResponse<Page<CustomerReminderDto>> getReminders(String bucket, String search, int page, int size);

    // Reminders page: counts per bucket for the filter chips
    ApiResponse<Map<String, Long>> getReminderStats();
}
