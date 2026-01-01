package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignFileUploadRequest;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignPhaseFileDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhaseFile;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.DesignPhaseFileRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.DesignPhaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DesignPhaseFileServiceImpl implements DesignPhaseFileService {

    @Autowired
    private DesignPhaseFileRepository fileRepository;

    @Autowired
    private DesignPhaseRepository designPhaseRepository;

    @Value("${app.design-upload-dir:uploads/design-files}")
    private String uploadDir;

    @Value("${app.max-file-size:52428800}") // 50MB default
    private long maxFileSize;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "jpg", "jpeg", "png", "pdf", "dwg", "dxf", "skp", "3ds", "obj",
            "fbx", "stl", "step", "stp", "iges", "igs", "doc", "docx", "xls", "xlsx", "zip", "rar"
    );

    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "application/pdf",
            "application/zip", "application/x-zip-compressed",
            "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/octet-stream" // For CAD files
    );

    @Override
    public ApiResponse<DesignPhaseFileDto> uploadDesignFile(MultipartFile file, DesignFileUploadRequest request, String uploadedBy) {
        try {
            // Validate design phase exists
            DesignPhase designPhase = null;

            if (request.getDesignPhaseId() != null) {
                designPhase = designPhaseRepository.findById(request.getDesignPhaseId()).orElse(null);
            } else if (request.getCustomerId() != null) {
                designPhase = designPhaseRepository.findByCustomerId(request.getCustomerId()).orElse(null);
            }

            if (designPhase == null) {
                return ApiResponse.error("Design phase not found");
            }

            // Validate file
            String validationError = validateFile(file);
            if (validationError != null) {
                return ApiResponse.error(validationError);
            }

            // Create upload directory if it doesn't exist
            createUploadDirectoryIfNotExists();

            // Generate unique filename
            String fileName = generateUniqueFileName(file.getOriginalFilename(), designPhase.getCustomer().getId());

            // Save file to disk
            Path filePath = Paths.get(uploadDir, fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Create database record
            DesignPhaseFile designFile = new DesignPhaseFile();
            designFile.setDesignPhase(designPhase);
            designFile.setFileName(fileName);
            designFile.setOriginalFileName(file.getOriginalFilename());
            designFile.setFileUrl("/uploads/design-files/" + fileName);
            designFile.setFileSize(file.getSize());
            designFile.setFileType(file.getContentType());
            designFile.setFileCategory(request.getFileCategory() != null ? request.getFileCategory() : DesignPhaseFile.FileCategory.DESIGN);
            designFile.setDescription(request.getDescription());
            designFile.setUploadedBy(uploadedBy);

            DesignPhaseFile savedFile = fileRepository.save(designFile);

            return ApiResponse.success("File uploaded successfully", convertToDto(savedFile));

        } catch (IOException e) {
            return ApiResponse.error("Failed to upload file: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("Unexpected error: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<DesignPhaseFileDto>> getDesignPhaseFiles(Long designPhaseId) {
        try {
            List<DesignPhaseFile> files = fileRepository.findByDesignPhaseId(designPhaseId);
            List<DesignPhaseFileDto> dtoList = files.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            return ApiResponse.success(dtoList);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch files: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<DesignPhaseFileDto>> getDesignPhaseFilesByCustomer(Long customerId) {
        try {
            List<DesignPhaseFile> files = fileRepository.findByCustomerId(customerId);
            List<DesignPhaseFileDto> dtoList = files.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            return ApiResponse.success(dtoList);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch files: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<DesignPhaseFileDto>> getDesignPhaseFilesByCategory(Long designPhaseId, String category) {
        try {
            DesignPhaseFile.FileCategory fileCategory = DesignPhaseFile.FileCategory.valueOf(category.toUpperCase());
            List<DesignPhaseFile> files = fileRepository.findByDesignPhaseIdAndFileCategory(designPhaseId, fileCategory);
            List<DesignPhaseFileDto> dtoList = files.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            return ApiResponse.success(dtoList);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("Invalid file category: " + category);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch files: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<DesignPhaseFileDto> getFileById(Long id) {
        try {
            DesignPhaseFile file = fileRepository.findById(id).orElse(null);
            if (file == null) {
                return ApiResponse.error("File not found");
            }

            return ApiResponse.success(convertToDto(file));
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch file: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<String> deleteFile(Long id) {
        try {
            DesignPhaseFile file = fileRepository.findById(id).orElse(null);
            if (file == null) {
                return ApiResponse.error("File not found");
            }

            // Delete file from disk
            String relativePath = file.getFileUrl().replace("/uploads/design-files/", "");
            Path filePath = Paths.get(uploadDir, relativePath);

            try {
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                // Log but don't fail - file might not exist on disk
                System.err.println("Could not delete file: " + filePath + " - " + e.getMessage());
            }

            // Delete database record
            fileRepository.delete(file);

            return ApiResponse.success("File deleted successfully");
        } catch (Exception e) {
            return ApiResponse.error("Failed to delete file: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<DesignPhaseFileDto> updateFileInfo(Long id, DesignPhaseFileDto dto) {
        try {
            DesignPhaseFile file = fileRepository.findById(id).orElse(null);
            if (file == null) {
                return ApiResponse.error("File not found");
            }

            // Update allowed fields (not the file itself)
            if (dto.getFileCategory() != null) {
                file.setFileCategory(dto.getFileCategory());
            }
            if (dto.getDescription() != null) {
                file.setDescription(dto.getDescription());
            }

            DesignPhaseFile updatedFile = fileRepository.save(file);
            return ApiResponse.success("File info updated successfully", convertToDto(updatedFile));

        } catch (Exception e) {
            return ApiResponse.error("Failed to update file info: " + e.getMessage());
        }
    }

    // Helper methods
    private String validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            return "File is empty";
        }

        if (file.getSize() > maxFileSize) {
            return "File size exceeds maximum allowed size of " + (maxFileSize / 1024 / 1024) + "MB";
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return "Invalid filename";
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return "File type not allowed. Allowed types: " + String.join(", ", ALLOWED_EXTENSIONS);
        }

        String mimeType = file.getContentType();
        if (mimeType != null && !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            // Allow octet-stream for CAD files
            if (!mimeType.equals("application/octet-stream")) {
                return "Invalid file format";
            }
        }

        return null; // Valid file
    }

    private void createUploadDirectoryIfNotExists() throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
    }

    private String generateUniqueFileName(String originalFilename, Long customerId) {
        String extension = getFileExtension(originalFilename);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 8);

        return String.format("design_customer_%d_%s_%s.%s", customerId, timestamp, uuid, extension);
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1) : "";
    }

    private DesignPhaseFileDto convertToDto(DesignPhaseFile file) {
        DesignPhaseFileDto dto = new DesignPhaseFileDto();
        dto.setId(file.getId());
        dto.setDesignPhaseId(file.getDesignPhase().getId());
        dto.setCustomerId(file.getDesignPhase().getCustomer().getId());
        dto.setCustomerName(file.getDesignPhase().getCustomer().getName());
        dto.setFileName(file.getFileName());
        dto.setOriginalFileName(file.getOriginalFileName());
        dto.setFileUrl(file.getFileUrl());
        dto.setFileSize(file.getFileSize());
        dto.setFileType(file.getFileType());
        dto.setFileCategory(file.getFileCategory());
        dto.setDescription(file.getDescription());
        dto.setUploadedBy(file.getUploadedBy());
        dto.setCreatedAt(file.getCreatedAt());
        dto.setUpdatedAt(file.getUpdatedAt());
        return dto;
    }
}
