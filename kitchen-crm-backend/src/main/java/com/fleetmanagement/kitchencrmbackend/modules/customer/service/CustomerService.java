package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Map;

public interface CustomerService {
    ApiResponse<Page<CustomerDto>> getAllCustomers(String search, String name, String email,
                                                   Customer.CustomerStatus status,
                                                   Customer.LeadSourceType leadSourceType,
                                                   String address, String kitchenTypes,
                                                   LocalDateTime createdFrom, LocalDateTime createdTo,
                                                   Pageable pageable);
    ApiResponse<CustomerDto> getCustomerById(Long id);
    ApiResponse<CustomerDto> createCustomer(CustomerCreateDto customerCreateDto, String createdBy);
    ApiResponse<CustomerDto> updateCustomer(Long id, CustomerDto customerDto, String updatedBy);
    ApiResponse<String> deleteCustomer(Long id);
    ApiResponse<String> updateCustomerStatus(Long id, Customer.CustomerStatus newStatus, String changedBy, String reason);

    /**
     * Status change that, when an admin moves a customer to DESIGN_STAGE, assigns the design to a
     * Designer-type staff member (required unless the customer already has a live design job with a
     * designer). Nobody else chooses a designer: the customer waits for the admin to assign one.
     *
     * @param changedByAdmin the caller is a super admin
     */
    ApiResponse<String> updateCustomerStatus(Long id, Customer.CustomerStatus newStatus, String changedBy, String reason,
                                             Long designerId, java.time.LocalDate designDueDate, String designPriority,
                                             Long changedByUserId, boolean changedByAdmin);
    ApiResponse<Map<String, Long>> getCustomerStatistics();
}