package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerRequirementsCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerRequirementsDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerRequirementsUpdateDto;

public interface CustomerRequirementsService {
    ApiResponse<CustomerRequirementsDto> getRequirementsByCustomerId(Long customerId);
    ApiResponse<CustomerRequirementsDto> createRequirements(Long customerId, CustomerRequirementsCreateDto dto, String createdBy);
    ApiResponse<CustomerRequirementsDto> updateRequirements(Long customerId, CustomerRequirementsUpdateDto dto, String updatedBy);
    ApiResponse<String> deleteRequirements(Long customerId);
}


