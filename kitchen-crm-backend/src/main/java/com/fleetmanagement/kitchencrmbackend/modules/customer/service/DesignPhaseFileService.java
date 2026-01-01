package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignFileUploadRequest;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignPhaseFileDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DesignPhaseFileService {

    ApiResponse<DesignPhaseFileDto> uploadDesignFile(MultipartFile file, DesignFileUploadRequest request, String uploadedBy);

    ApiResponse<List<DesignPhaseFileDto>> getDesignPhaseFiles(Long designPhaseId);

    ApiResponse<List<DesignPhaseFileDto>> getDesignPhaseFilesByCustomer(Long customerId);

    ApiResponse<List<DesignPhaseFileDto>> getDesignPhaseFilesByCategory(Long designPhaseId, String category);

    ApiResponse<DesignPhaseFileDto> getFileById(Long id);

    ApiResponse<String> deleteFile(Long id);

    ApiResponse<DesignPhaseFileDto> updateFileInfo(Long id, DesignPhaseFileDto dto);
}
