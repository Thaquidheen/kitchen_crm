package com.fleetmanagement.kitchencrmbackend.modules.designer.service;

import com.fleetmanagement.kitchencrmbackend.modules.designer.dto.*;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface DesignerService {

    ApiResponse<Page<DesignerDto>> getAllDesigners(Pageable pageable);

    ApiResponse<List<DesignerDto>> getActiveDesigners();

    ApiResponse<List<DesignerDto>> getAvailableDesigners();

    ApiResponse<DesignerDto> getDesignerById(Long id);

    ApiResponse<DesignerDto> getDesignerByEmail(String email);

    ApiResponse<DesignerDto> createDesigner(DesignerCreateDto designerCreateDto);

    ApiResponse<DesignerDto> updateDesigner(Long id, DesignerUpdateDto designerUpdateDto);

    ApiResponse<String> deleteDesigner(Long id);

    ApiResponse<String> toggleDesignerStatus(Long id);

    ApiResponse<List<DesignerDto>> searchDesigners(String query);

    ApiResponse<List<DesignerDto>> getDesignersByDepartment(String department);

    ApiResponse<List<DesignerDto>> getDesignersBySpecialization(String specialization);

    ApiResponse<Map<String, Object>> getDesignerStatistics();
}
