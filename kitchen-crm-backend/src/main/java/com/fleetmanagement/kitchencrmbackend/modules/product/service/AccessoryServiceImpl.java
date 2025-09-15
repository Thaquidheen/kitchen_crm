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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccessoryServiceImpl implements AccessoryService {

    @Autowired
    private AccessoryRepository accessoryRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BrandRepository brandRepository;

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

        accessory.setActive(false);
        accessoryRepository.save(accessory);
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
}