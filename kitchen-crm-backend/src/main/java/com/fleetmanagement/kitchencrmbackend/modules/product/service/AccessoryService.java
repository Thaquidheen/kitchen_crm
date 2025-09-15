package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.AccessoryDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AccessoryService {
    ApiResponse<Page<AccessoryDto>> getAllAccessories(String name, Long categoryId, Long brandId, Boolean active, Pageable pageable);
    ApiResponse<List<AccessoryDto>> getActiveAccessories();
    ApiResponse<AccessoryDto> getAccessoryById(Long id);
    ApiResponse<AccessoryDto> createAccessory(AccessoryDto accessoryDto);
    ApiResponse<AccessoryDto> updateAccessory(Long id, AccessoryDto accessoryDto);
    ApiResponse<String> deleteAccessory(Long id);
}