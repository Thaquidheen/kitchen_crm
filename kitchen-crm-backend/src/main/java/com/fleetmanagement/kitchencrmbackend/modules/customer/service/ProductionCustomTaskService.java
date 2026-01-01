package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionCustomTaskCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionCustomTaskDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionCustomTaskUpdateDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;

import java.util.List;

public interface ProductionCustomTaskService {

    ApiResponse<ProductionCustomTaskDto> createTask(ProductionCustomTaskCreateDto createDto);

    ApiResponse<ProductionCustomTaskDto> updateTask(Long taskId, ProductionCustomTaskUpdateDto updateDto);

    ApiResponse<ProductionCustomTaskDto> toggleTaskCompletion(Long taskId);

    ApiResponse<List<ProductionCustomTaskDto>> getTasksByCustomerId(Long customerId);

    ApiResponse<List<ProductionCustomTaskDto>> getTasksByCustomerIdAndPhase(Long customerId, String phase);

    ApiResponse<ProductionCustomTaskDto> getTaskById(Long taskId);

    ApiResponse<Void> deleteTask(Long taskId);

    ApiResponse<List<ProductionCustomTaskDto>> reorderTasks(Long customerId, List<Long> taskIds);
}
