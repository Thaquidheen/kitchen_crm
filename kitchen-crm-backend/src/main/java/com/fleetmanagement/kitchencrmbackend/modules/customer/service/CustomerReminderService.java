package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerReminderDto;

import java.util.List;
import java.util.Map;

public interface CustomerReminderService {
    ApiResponse<CustomerReminderDto> createReminder(CustomerReminderDto dto, String createdBy);
    ApiResponse<CustomerReminderDto> updateReminder(Long id, CustomerReminderDto dto);
    ApiResponse<String> markDone(Long id);
    ApiResponse<String> deleteReminder(Long id);
    ApiResponse<List<CustomerReminderDto>> getRemindersForCustomer(Long customerId);
    ApiResponse<List<CustomerReminderDto>> getOpenReminders();
    // Bell feed: due (unacknowledged) reminders + count
    ApiResponse<Map<String, Object>> getNotifications();
}
