package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerFollowUpDto;

import java.util.List;

public interface CustomerFollowUpService {
    ApiResponse<CustomerFollowUpDto> createFollowUp(CustomerFollowUpDto dto, String createdBy);
    ApiResponse<List<CustomerFollowUpDto>> getFollowUpsForCustomer(Long customerId);
    ApiResponse<String> deleteFollowUp(Long id);
}
