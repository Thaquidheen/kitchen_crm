package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerFollowUpDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerReminderDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerFollowUp;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerFollowUpRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CustomerFollowUpServiceImpl implements CustomerFollowUpService {

    @Autowired
    private CustomerFollowUpRepository followUpRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerReminderService reminderService;

    @Override
    public ApiResponse<CustomerFollowUpDto> createFollowUp(CustomerFollowUpDto dto, String createdBy) {
        Customer customer = customerRepository.findById(dto.getCustomerId()).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }
        CustomerFollowUp followUp = new CustomerFollowUp();
        followUp.setCustomer(customer);
        followUp.setFollowupType(dto.getFollowupType() != null ? dto.getFollowupType() : CustomerFollowUp.FollowUpType.CALL);
        followUp.setNotes(dto.getNotes());
        followUp.setNextFollowUpAt(dto.getNextFollowUpAt());
        followUp.setCreatedBy(createdBy);
        CustomerFollowUp saved = followUpRepository.save(followUp);

        // A scheduled next follow-up becomes a reminder so the header bell notifies on time.
        if (dto.getNextFollowUpAt() != null) {
            CustomerReminderDto reminder = new CustomerReminderDto();
            reminder.setCustomerId(customer.getId());
            reminder.setTitle("Follow up: " + customer.getName());
            reminder.setNotes(dto.getNotes());
            reminder.setRemindAt(dto.getNextFollowUpAt());
            reminderService.createReminder(reminder, createdBy);
        }

        return ApiResponse.success("Follow-up recorded", convertToDto(saved));
    }

    @Override
    public ApiResponse<List<CustomerFollowUpDto>> getFollowUpsForCustomer(Long customerId) {
        return ApiResponse.success(followUpRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream().map(this::convertToDto).toList());
    }

    @Override
    public ApiResponse<String> deleteFollowUp(Long id) {
        if (!followUpRepository.existsById(id)) {
            return ApiResponse.error("Follow-up not found");
        }
        followUpRepository.deleteById(id);
        return ApiResponse.success("Follow-up deleted");
    }

    private CustomerFollowUpDto convertToDto(CustomerFollowUp f) {
        CustomerFollowUpDto dto = new CustomerFollowUpDto();
        dto.setId(f.getId());
        dto.setCustomerId(f.getCustomer().getId());
        dto.setCustomerName(f.getCustomer().getName());
        dto.setFollowupType(f.getFollowupType());
        dto.setNotes(f.getNotes());
        dto.setNextFollowUpAt(f.getNextFollowUpAt());
        dto.setCreatedBy(f.getCreatedBy());
        dto.setCreatedAt(f.getCreatedAt());
        return dto;
    }
}
