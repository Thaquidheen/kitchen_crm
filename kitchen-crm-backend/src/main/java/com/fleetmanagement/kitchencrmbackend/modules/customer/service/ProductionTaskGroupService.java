package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionTaskGroupCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionTaskGroupDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionTaskGroupUpdateDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;

import java.util.List;

public interface ProductionTaskGroupService {

    ApiResponse<ProductionTaskGroupDto> createGroup(ProductionTaskGroupCreateDto createDto);

    ApiResponse<ProductionTaskGroupDto> updateGroup(Long groupId, ProductionTaskGroupUpdateDto updateDto);

    ApiResponse<List<ProductionTaskGroupDto>> getGroupsByCustomerId(Long customerId);

    ApiResponse<ProductionTaskGroupDto> getGroupById(Long groupId);

    ApiResponse<Void> deleteGroup(Long groupId);

    ApiResponse<List<ProductionTaskGroupDto>> reorderGroups(Long customerId, List<Long> groupIds);
}
