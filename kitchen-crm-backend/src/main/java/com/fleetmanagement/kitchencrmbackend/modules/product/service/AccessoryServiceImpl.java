package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.AccessoryDto;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Accessory;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Brand;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Category;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.AccessoryRepository;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.BrandRepository;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.CategoryRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public class AccessoryServiceImpl implements AccessoryService {

    @Autowired
    private AccessoryRepository accessoryRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Value("${app.accessory-upload-dir:uploads/accessory-images}")
    private String uploadDir;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png");
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList("image/jpeg", "image/jpg", "image/png");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @Override
    public ApiResponse<Page<AccessoryDto>> getAllAccessories(String name, Long categoryId, Long brandId,
                                                             Boolean active, Pageable pageable) {
        Page<Accessory> accessories = accessoryRepository.findByFilters(name, categoryId, brandId, active, pageable);
        Page<AccessoryDto> accessoryDtos = accessories.map(this::convertToDto);
        return ApiResponse.success(accessoryDtos);
    }

    @Override
    public ApiResponse<List<AccessoryDto>> getActiveAccessories() {
        List<Accessory> accessories = accessoryRepository.findByActiveTrue();
        List<AccessoryDto> accessoryDtos = accessories.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(accessoryDtos);
    }

    @Override
    public ApiResponse<AccessoryDto> getAccessoryById(Long id) {
        Accessory accessory = accessoryRepository.findById(id).orElse(null);
        if (accessory == null) {
            return ApiResponse.error("Accessory not found");
        }
        return ApiResponse.success(convertToDto(accessory));
    }

    @Override
    public ApiResponse<AccessoryDto> createAccessory(AccessoryDto accessoryDto) {
        if (accessoryDto.getMaterialCode() != null &&
                accessoryRepository.existsByMaterialCode(accessoryDto.getMaterialCode())) {
            return ApiResponse.error("Material code already exists");
        }

        Accessory accessory = convertToEntity(accessoryDto);
        if (accessory == null) {
            return ApiResponse.error("Invalid category or brand ID");
        }

        Accessory savedAccessory = accessoryRepository.save(accessory);
        return ApiResponse.success("Accessory created successfully", convertToDto(savedAccessory));
    }

    @Override
    public ApiResponse<AccessoryDto> updateAccessory(Long id, AccessoryDto accessoryDto) {
        Accessory existingAccessory = accessoryRepository.findById(id).orElse(null);
        if (existingAccessory == null) {
            return ApiResponse.error("Accessory not found");
        }

        // Check material code uniqueness
        if (accessoryDto.getMaterialCode() != null &&
                !accessoryDto.getMaterialCode().equals(existingAccessory.getMaterialCode()) &&
                accessoryRepository.existsByMaterialCode(accessoryDto.getMaterialCode())) {
            return ApiResponse.error("Material code already exists");
        }

        updateEntityFromDto(existingAccessory, accessoryDto);
        Accessory updatedAccessory = accessoryRepository.save(existingAccessory);
        return ApiResponse.success("Accessory updated successfully", convertToDto(updatedAccessory));
    }

    @Override
    public ApiResponse<String> deleteAccessory(Long id) {
        Accessory accessory = accessoryRepository.findById(id).orElse(null);
        if (accessory == null) {
            return ApiResponse.error("Accessory not found");
        }

        accessoryRepository.delete(accessory);
        return ApiResponse.success("Accessory deleted successfully");
    }

    private AccessoryDto convertToDto(Accessory accessory) {
        return new AccessoryDto(
                accessory.getId(),
                accessory.getName(),
                accessory.getCategory() != null ? accessory.getCategory().getId() : null,
                accessory.getCategory() != null ? accessory.getCategory().getName() : null,
                accessory.getBrand() != null ? accessory.getBrand().getId() : null,
                accessory.getBrand() != null ? accessory.getBrand().getName() : null,
                accessory.getMaterialCode(),
                accessory.getWidthMm(),
                accessory.getHeightMm(),
                accessory.getDepthMm(),
                accessory.getImageUrl(),
                accessory.getColor(),
                accessory.getMrp(),
                accessory.getDiscountPercentage(),
                accessory.getCompanyPrice(),
                accessory.getActive()
        );
    }

    private Accessory convertToEntity(AccessoryDto dto) {
        Accessory accessory = new Accessory();

        // Set category if provided
        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId()).orElse(null);
            if (category == null) return null;
            accessory.setCategory(category);
        }

        // Set brand if provided
        if (dto.getBrandId() != null) {
            Brand brand = brandRepository.findById(dto.getBrandId()).orElse(null);
            if (brand == null) return null;
            accessory.setBrand(brand);
        }

        accessory.setName(dto.getName());
        accessory.setMaterialCode(dto.getMaterialCode());
        accessory.setWidthMm(dto.getWidthMm());
        accessory.setHeightMm(dto.getHeightMm());
        accessory.setDepthMm(dto.getDepthMm());
        accessory.setImageUrl(dto.getImageUrl());
        accessory.setColor(dto.getColor());
        accessory.setMrp(dto.getMrp());
        accessory.setDiscountPercentage(dto.getDiscountPercentage());
        accessory.setActive(dto.getActive() != null ? dto.getActive() : true);

        return accessory;
    }

    private void updateEntityFromDto(Accessory accessory, AccessoryDto dto) {
        // Update category if provided
        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId()).orElse(null);
            accessory.setCategory(category);
        }

        // Update brand if provided
        if (dto.getBrandId() != null) {
            Brand brand = brandRepository.findById(dto.getBrandId()).orElse(null);
            accessory.setBrand(brand);
        }

        accessory.setName(dto.getName());
        accessory.setMaterialCode(dto.getMaterialCode());
        accessory.setWidthMm(dto.getWidthMm());
        accessory.setHeightMm(dto.getHeightMm());
        accessory.setDepthMm(dto.getDepthMm());
        accessory.setImageUrl(dto.getImageUrl());
        accessory.setColor(dto.getColor());
        accessory.setMrp(dto.getMrp());
        accessory.setDiscountPercentage(dto.getDiscountPercentage());
        accessory.setActive(dto.getActive());
    }

    @Override
    public ApiResponse<AccessoryDto> uploadImage(Long id, MultipartFile file) {
        try {
            // Find accessory
            Accessory accessory = accessoryRepository.findById(id).orElse(null);
            if (accessory == null) {
                return ApiResponse.error("Accessory not found");
            }

            // Validate file
            String validationError = validateFile(file);
            if (validationError != null) {
                return ApiResponse.error(validationError);
            }

            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String fileName = generateUniqueFileName(file.getOriginalFilename(), id);

            // Save file to disk
            Path filePath = Paths.get(uploadDir, fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Delete old image if exists
            if (accessory.getImageUrl() != null && !accessory.getImageUrl().isEmpty()) {
                try {
                    String oldFileName = accessory.getImageUrl().replace("/uploads/accessory-images/", "");
                    Path oldFilePath = Paths.get(uploadDir, oldFileName);
                    Files.deleteIfExists(oldFilePath);
                } catch (IOException e) {
                    // Log but don't fail
                }
            }

            // Update accessory with new image URL
            accessory.setImageUrl("/uploads/accessory-images/" + fileName);
            Accessory savedAccessory = accessoryRepository.save(accessory);

            return ApiResponse.success("Image uploaded successfully", convertToDto(savedAccessory));

        } catch (IOException e) {
            return ApiResponse.error("Failed to upload file: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("Unexpected error: " + e.getMessage());
        }
    }

    private String validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            return "File is empty";
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return "File size exceeds maximum allowed size of 5MB";
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

        return null;
    }

    private String generateUniqueFileName(String originalFilename, Long accessoryId) {
        String extension = getFileExtension(originalFilename);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return String.format("accessory_%d_%s_%s.%s", accessoryId, timestamp, uuid, extension);
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1) : "";
    }
}