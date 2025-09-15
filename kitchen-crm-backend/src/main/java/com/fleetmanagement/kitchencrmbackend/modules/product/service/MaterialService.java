package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.MaterialDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;

import java.util.List;

public interface MaterialService {
    ApiResponse<List<MaterialDto>> getAllMaterials();
    ApiResponse<List<MaterialDto>> getActiveMaterials();
    ApiResponse<MaterialDto> getMaterialById(Long id);
    ApiResponse<MaterialDto> createMaterial(MaterialDto materialDto);
    ApiResponse<MaterialDto> updateMaterial(Long id, MaterialDto materialDto);
    ApiResponse<String> deleteMaterial(Long id);
}