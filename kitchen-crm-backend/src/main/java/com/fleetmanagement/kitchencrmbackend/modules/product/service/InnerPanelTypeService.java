package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.InnerPanelTypeDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;

import java.util.List;

public interface InnerPanelTypeService {
    ApiResponse<List<InnerPanelTypeDto>> getAllInnerPanelTypes();
    ApiResponse<List<InnerPanelTypeDto>> getActiveInnerPanelTypes();
    ApiResponse<InnerPanelTypeDto> getInnerPanelTypeById(Long id);
    ApiResponse<InnerPanelTypeDto> createInnerPanelType(InnerPanelTypeDto dto);
    ApiResponse<InnerPanelTypeDto> updateInnerPanelType(Long id, InnerPanelTypeDto dto);
    ApiResponse<String> deleteInnerPanelType(Long id);
}
