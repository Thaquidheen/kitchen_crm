package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface CustomerService {
    ApiResponse<Page<CustomerDto>> getAllCustomers(String name, String email, Customer.CustomerStatus status, Pageable pageable);
    ApiResponse<CustomerDto> getCustomerById(Long id);
    ApiResponse<CustomerDto> createCustomer(CustomerCreateDto customerCreateDto, String createdBy);
    ApiResponse<CustomerDto> updateCustomer(Long id, CustomerDto customerDto, String updatedBy);
    ApiResponse<String> deleteCustomer(Long id);
    ApiResponse<String> updateCustomerStatus(Long id, Customer.CustomerStatus newStatus, String changedBy, String reason);
    ApiResponse<Map<String, Long>> getCustomerStatistics();
}