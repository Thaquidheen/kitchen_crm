package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.CabinetTypeDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CabinetService {

    ApiResponse<Page<CabinetTypeDto>> getAllCabinets(String name, Long categoryId, Long brandId,
                                                     Long materialId, Boolean active, Pageable pageable);

    ApiResponse<List<CabinetTypeDto>> getActiveCabinets();

    ApiResponse<CabinetTypeDto> getCabinetById(Long id);

    ApiResponse<CabinetTypeDto> createCabinet(CabinetTypeDto cabinetDto);

    ApiResponse<CabinetTypeDto> updateCabinet(Long id, CabinetTypeDto cabinetDto);

    ApiResponse<String> deleteCabinet(Long id);

    ApiResponse<List<CabinetTypeDto>> getCabinetsByCategory(Long categoryId);

    ApiResponse<List<CabinetTypeDto>> getCabinetsByBrand(Long brandId);
}