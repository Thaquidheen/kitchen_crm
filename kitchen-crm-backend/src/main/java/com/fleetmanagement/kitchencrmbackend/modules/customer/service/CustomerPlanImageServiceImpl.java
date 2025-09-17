package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerPlanImageDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.PlanImageUploadRequest;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerPlanImage;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerPlanImageRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
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
public class CustomerPlanImageServiceImpl implements CustomerPlanImageService {

    @Autowired
    private CustomerPlanImageRepository planImageRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Value("${app.upload-dir:uploads/plan-images}")
    private String uploadDir;

    @Value("${app.max-file-size:10485760}") // 10MB default
    private long maxFileSize;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "pdf");
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "application/pdf"
    );

    @Override
    public ApiResponse<CustomerPlanImageDto> uploadPlanImage(MultipartFile file, PlanImageUploadRequest request) {
        try {
            // Validate customer exists
            Customer customer = customerRepository.findById(request.getCustomerId()).orElse(null);
            if (customer == null) {
                return ApiResponse.error("Customer not found");
            }

            // Validate file
            String validationError = validateFile(file);
            if (validationError != null) {
                return ApiResponse.error(validationError);
            }

            // Create upload directory if it doesn't exist
            createUploadDirectoryIfNotExists();

            // Generate unique filename
            String fileName = generateUniqueFileName(file.getOriginalFilename(), request.getCustomerId());

            // Save file to disk
            Path filePath = Paths.get(uploadDir, fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Create database record
            CustomerPlanImage planImage = new CustomerPlanImage();
            planImage.setCustomer(customer);
            planImage.setImageName(file.getOriginalFilename());
            planImage.setImageUrl("/uploads/plan-images/" + fileName);
            planImage.setImageType(request.getImageType());

            CustomerPlanImage savedImage = planImageRepository.save(planImage);

            return ApiResponse.success("Plan image uploaded successfully", convertToDto(savedImage));

        } catch (IOException e) {
            return ApiResponse.error("Failed to upload file: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("Unexpected error: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<CustomerPlanImageDto>> getCustomerPlanImages(Long customerId) {
        try {
            List<CustomerPlanImage> planImages = planImageRepository.findByCustomerId(customerId);
            List<CustomerPlanImageDto> dtoList = planImages.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            return ApiResponse.success(dtoList);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch plan images: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<CustomerPlanImageDto>> getCustomerPlanImagesByType(Long customerId, String imageType) {
        try {
            CustomerPlanImage.ImageType type = CustomerPlanImage.ImageType.valueOf(imageType.toUpperCase());
            List<CustomerPlanImage> planImages = planImageRepository.findByCustomerIdAndImageType(customerId, type);
            List<CustomerPlanImageDto> dtoList = planImages.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            return ApiResponse.success(dtoList);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("Invalid image type: " + imageType);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch plan images: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<CustomerPlanImageDto> getPlanImageById(Long id) {
        try {
            CustomerPlanImage planImage = planImageRepository.findById(id).orElse(null);
            if (planImage == null) {
                return ApiResponse.error("Plan image not found");
            }

            return ApiResponse.success(convertToDto(planImage));
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch plan image: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<String> deletePlanImage(Long id) {
        try {
            CustomerPlanImage planImage = planImageRepository.findById(id).orElse(null);
            if (planImage == null) {
                return ApiResponse.error("Plan image not found");
            }

            // Delete file from disk
            String relativePath = planImage.getImageUrl().replace("/uploads/plan-images/", "");
            Path filePath = Paths.get(uploadDir, relativePath);

            try {
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                // Log but don't fail - file might not exist on disk
                System.err.println("Could not delete file: " + filePath + " - " + e.getMessage());
            }

            // Delete database record
            planImageRepository.delete(planImage);

            return ApiResponse.success("Plan image deleted successfully");
        } catch (Exception e) {
            return ApiResponse.error("Failed to delete plan image: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<CustomerPlanImageDto> updatePlanImageInfo(Long id, CustomerPlanImageDto dto) {
        try {
            CustomerPlanImage planImage = planImageRepository.findById(id).orElse(null);
            if (planImage == null) {
                return ApiResponse.error("Plan image not found");
            }

            // Update allowed fields (not the file itself)
            planImage.setImageName(dto.getImageName());
            planImage.setImageType(dto.getImageType());

            CustomerPlanImage updatedImage = planImageRepository.save(planImage);
            return ApiResponse.success("Plan image updated successfully", convertToDto(updatedImage));

        } catch (Exception e) {
            return ApiResponse.error("Failed to update plan image: " + e.getMessage());
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
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            return "Invalid file format";
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

        return String.format("customer_%d_%s_%s.%s", customerId, timestamp, uuid, extension);
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1) : "";
    }

    private CustomerPlanImageDto convertToDto(CustomerPlanImage planImage) {
        CustomerPlanImageDto dto = new CustomerPlanImageDto();
        dto.setId(planImage.getId());
        dto.setCustomerId(planImage.getCustomer().getId());
        dto.setImageName(planImage.getImageName());
        dto.setImageUrl(planImage.getImageUrl());
        dto.setImageType(planImage.getImageType());
        dto.setCreatedAt(planImage.getCreatedAt());
        dto.setUpdatedAt(planImage.getUpdatedAt());
        return dto;
    }
}
