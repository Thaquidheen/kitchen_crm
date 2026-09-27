package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerFollowUpDto;

import java.util.List;

public interface CustomerFollowUpService {
    ApiResponse<CustomerFollowUpDto> createFollowUp(CustomerFollowUpDto dto, String createdBy, Long createdByUserId);
    ApiResponse<List<CustomerFollowUpDto>> getFollowUpsForCustomer(Long customerId, long viewerId);
    ApiResponse<String> deleteFollowUp(Long id, long viewerId);
}
