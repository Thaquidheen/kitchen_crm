package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.PipelineDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;

public interface PipelineService {
    ApiResponse<PipelineDto> getPipelineByCustomerId(Long customerId);
    ApiResponse<PipelineDto> updatePipeline(Long customerId, PipelineDto pipelineDto, String updatedBy);
}