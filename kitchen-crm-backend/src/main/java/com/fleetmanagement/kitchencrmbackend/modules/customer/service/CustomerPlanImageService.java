package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerPlanImageDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.PlanImageUploadRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CustomerPlanImageService {
    ApiResponse<CustomerPlanImageDto> uploadPlanImage(MultipartFile file, PlanImageUploadRequest request);
    ApiResponse<List<CustomerPlanImageDto>> getCustomerPlanImages(Long customerId);
    ApiResponse<List<CustomerPlanImageDto>> getCustomerPlanImagesByType(Long customerId, String imageType);
    ApiResponse<CustomerPlanImageDto> getPlanImageById(Long id);
    ApiResponse<String> deletePlanImage(Long id);
    ApiResponse<CustomerPlanImageDto> updatePlanImageInfo(Long id, CustomerPlanImageDto dto);
}