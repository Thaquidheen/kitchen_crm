package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignFileUploadRequest;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignPhaseFileDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DesignPhaseFileService {

    ApiResponse<DesignPhaseFileDto> uploadDesignFile(MultipartFile file, DesignFileUploadRequest request, String uploadedBy);

    /**
     * What is wrong with a file before anything is stored, or null when it can be uploaded. Lets a
     * caller that takes several files refuse them all before writing the first.
     */
    String checkFile(MultipartFile file);

    ApiResponse<List<DesignPhaseFileDto>> getDesignPhaseFiles(Long designPhaseId);

    ApiResponse<List<DesignPhaseFileDto>> getDesignPhaseFilesByCustomer(Long customerId);

    ApiResponse<List<DesignPhaseFileDto>> getDesignPhaseFilesByCategory(Long designPhaseId, String category);

    ApiResponse<DesignPhaseFileDto> getFileById(Long id);

    ApiResponse<String> deleteFile(Long id);

    ApiResponse<DesignPhaseFileDto> updateFileInfo(Long id, DesignPhaseFileDto dto);
}
