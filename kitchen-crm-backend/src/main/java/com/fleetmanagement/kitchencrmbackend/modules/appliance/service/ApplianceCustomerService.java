package com.fleetmanagement.kitchencrmbackend.modules.appliance.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.dto.ApplianceCustomerDto;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.entity.ApplianceCustomer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface ApplianceCustomerService {
    ApiResponse<Page<ApplianceCustomerDto>> getAll(ApplianceCustomer.Category category,
                                                   ApplianceCustomer.Status status,
                                                   String search, Pageable pageable);
    ApiResponse<ApplianceCustomerDto> getById(Long id);
    ApiResponse<ApplianceCustomerDto> create(ApplianceCustomerDto dto, String createdBy);
    ApiResponse<ApplianceCustomerDto> update(Long id, ApplianceCustomerDto dto);
    ApiResponse<String> delete(Long id);
    /** Category chip counts are always global; status counts and total value are scoped
     *  to {@code category} so they line up with what the table is showing. */
    ApiResponse<Map<String, Object>> getStatistics(ApplianceCustomer.Category category);
}
