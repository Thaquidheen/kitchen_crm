package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerReminderDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerReminder;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerReminderRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class CustomerReminderServiceImpl implements CustomerReminderService {

    @Autowired
    private CustomerReminderRepository reminderRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Override
    public ApiResponse<CustomerReminderDto> createReminder(CustomerReminderDto dto, String createdBy) {
        Customer customer = customerRepository.findById(dto.getCustomerId()).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }
        CustomerReminder reminder = new CustomerReminder();
        reminder.setCustomer(customer);
        reminder.setTitle(dto.getTitle());
        reminder.setNotes(dto.getNotes());
        reminder.setRemindAt(dto.getRemindAt());
        // A reminder created with a past time is immediately due
        reminder.setStatus(dto.getRemindAt().isAfter(LocalDateTime.now())
                ? CustomerReminder.ReminderStatus.PENDING
                : CustomerReminder.ReminderStatus.DUE);
        reminder.setCreatedBy(createdBy);
        return ApiResponse.success("Reminder created", convertToDto(reminderRepository.save(reminder)));
    }

    @Override
    public ApiResponse<CustomerReminderDto> updateReminder(Long id, CustomerReminderDto dto) {
        CustomerReminder reminder = reminderRepository.findById(id).orElse(null);
        if (reminder == null) {
            return ApiResponse.error("Reminder not found");
        }
        if (dto.getTitle() != null && !dto.getTitle().isBlank()) reminder.setTitle(dto.getTitle());
        reminder.setNotes(dto.getNotes());
        if (dto.getRemindAt() != null) {
            reminder.setRemindAt(dto.getRemindAt());
            // Re-arm the reminder when its time is moved to the future
            if (dto.getRemindAt().isAfter(LocalDateTime.now())
                    && reminder.getStatus() != CustomerReminder.ReminderStatus.DONE) {
                reminder.setStatus(CustomerReminder.ReminderStatus.PENDING);
                reminder.setNotifiedAt(null);
            }
        }
        return ApiResponse.success("Reminder updated", convertToDto(reminderRepository.save(reminder)));
    }

    @Override
    public ApiResponse<String> markDone(Long id) {
        CustomerReminder reminder = reminderRepository.findById(id).orElse(null);
        if (reminder == null) {
            return ApiResponse.error("Reminder not found");
        }
        reminder.setStatus(CustomerReminder.ReminderStatus.DONE);
        reminderRepository.save(reminder);
        return ApiResponse.success("Reminder marked as done");
    }

    @Override
    public ApiResponse<String> deleteReminder(Long id) {
        if (!reminderRepository.existsById(id)) {
            return ApiResponse.error("Reminder not found");
        }
        reminderRepository.deleteById(id);
        return ApiResponse.success("Reminder deleted");
    }

    @Override
    public ApiResponse<List<CustomerReminderDto>> getRemindersForCustomer(Long customerId) {
        return ApiResponse.success(reminderRepository.findByCustomerIdOrderByRemindAtDesc(customerId)
                .stream().map(this::convertToDto).toList());
    }

    @Override
    public ApiResponse<List<CustomerReminderDto>> getOpenReminders() {
        return ApiResponse.success(reminderRepository.findByStatusInOrderByRemindAtAsc(
                        List.of(CustomerReminder.ReminderStatus.PENDING, CustomerReminder.ReminderStatus.DUE))
                .stream().map(this::convertToDto).toList());
    }

    @Override
    public ApiResponse<Map<String, Object>> getNotifications() {
        List<CustomerReminderDto> due = reminderRepository
                .findByStatusOrderByRemindAtDesc(CustomerReminder.ReminderStatus.DUE)
                .stream().map(this::convertToDto).toList();
        Map<String, Object> payload = new HashMap<>();
        payload.put("count", due.size());
        payload.put("reminders", due);
        return ApiResponse.success(payload);
    }

    // Flip pending reminders to DUE once their time arrives; the bell polls for DUE ones.
    @Scheduled(fixedRate = 60000)
    public void markDueReminders() {
        List<CustomerReminder> dueNow = reminderRepository.findByStatusAndRemindAtBefore(
                CustomerReminder.ReminderStatus.PENDING, LocalDateTime.now());
        if (dueNow.isEmpty()) return;
        LocalDateTime now = LocalDateTime.now();
        for (CustomerReminder r : dueNow) {
            r.setStatus(CustomerReminder.ReminderStatus.DUE);
            r.setNotifiedAt(now);
        }
        reminderRepository.saveAll(dueNow);
    }

    private CustomerReminderDto convertToDto(CustomerReminder r) {
        CustomerReminderDto dto = new CustomerReminderDto();
        dto.setId(r.getId());
        dto.setCustomerId(r.getCustomer().getId());
        dto.setCustomerName(r.getCustomer().getName());
        dto.setTitle(r.getTitle());
        dto.setNotes(r.getNotes());
        dto.setRemindAt(r.getRemindAt());
        dto.setStatus(r.getStatus());
        dto.setNotifiedAt(r.getNotifiedAt());
        dto.setCreatedBy(r.getCreatedBy());
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
