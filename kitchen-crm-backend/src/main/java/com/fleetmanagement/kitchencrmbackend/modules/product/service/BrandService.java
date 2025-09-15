package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.BrandDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;

import java.util.List;

public interface BrandService {
    ApiResponse<List<BrandDto>> getAllBrands();
    ApiResponse<List<BrandDto>> getActiveBrands();
    ApiResponse<BrandDto> getBrandById(Long id);
    ApiResponse<BrandDto> createBrand(BrandDto brandDto);
    ApiResponse<BrandDto> updateBrand(Long id, BrandDto brandDto);
    ApiResponse<String> deleteBrand(Long id);
}