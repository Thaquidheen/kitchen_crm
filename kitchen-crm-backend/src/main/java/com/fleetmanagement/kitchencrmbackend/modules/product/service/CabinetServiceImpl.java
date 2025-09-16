package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.CabinetTypeDto;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.CabinetType;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Brand;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Category;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Material;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.CabinetTypeRepository;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.BrandRepository;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.CategoryRepository;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.MaterialRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CabinetServiceImpl implements CabinetService {

    @Autowired
    private CabinetTypeRepository cabinetTypeRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Override
    public ApiResponse<Page<CabinetTypeDto>> getAllCabinets(String name, Long categoryId, Long brandId,
                                                            Long materialId, Boolean active, Pageable pageable) {
        try {
            Page<CabinetType> cabinets = cabinetTypeRepository.findByFilters(name, categoryId, brandId, materialId, active, pageable);
            Page<CabinetTypeDto> cabinetDtos = cabinets.map(this::convertToDto);
            return ApiResponse.success("Cabinets retrieved successfully", cabinetDtos);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve cabinets: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<CabinetTypeDto>> getActiveCabinets() {
        try {
            List<CabinetType> cabinets = cabinetTypeRepository.findByActiveTrue();
            List<CabinetTypeDto> cabinetDtos = cabinets.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            return ApiResponse.success("Active cabinets retrieved successfully", cabinetDtos);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve active cabinets: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<CabinetTypeDto> getCabinetById(Long id) {
        try {
            Optional<CabinetType> cabinet = cabinetTypeRepository.findById(id);
            if (cabinet.isPresent()) {
                return ApiResponse.success("Cabinet found", convertToDto(cabinet.get()));
            } else {
                return ApiResponse.error("Cabinet not found with id: " + id);
            }
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve cabinet: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<CabinetTypeDto> createCabinet(CabinetTypeDto cabinetDto) {
        try {
            CabinetType cabinet = convertToEntity(cabinetDto);
            CabinetType savedCabinet = cabinetTypeRepository.save(cabinet);
            return ApiResponse.success("Cabinet created successfully", convertToDto(savedCabinet));
        } catch (Exception e) {
            return ApiResponse.error("Failed to create cabinet: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<CabinetTypeDto> updateCabinet(Long id, CabinetTypeDto cabinetDto) {
        try {
            Optional<CabinetType> existingCabinet = cabinetTypeRepository.findById(id);
            if (existingCabinet.isPresent()) {
                CabinetType cabinet = existingCabinet.get();
                updateEntityFromDto(cabinet, cabinetDto);
                CabinetType savedCabinet = cabinetTypeRepository.save(cabinet);
                return ApiResponse.success("Cabinet updated successfully", convertToDto(savedCabinet));
            } else {
                return ApiResponse.error("Cabinet not found with id: " + id);
            }
        } catch (Exception e) {
            return ApiResponse.error("Failed to update cabinet: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<String> deleteCabinet(Long id) {
        try {
            if (cabinetTypeRepository.existsById(id)) {
                cabinetTypeRepository.deleteById(id);
                return ApiResponse.success("Cabinet deleted successfully");
            } else {
                return ApiResponse.error("Cabinet not found with id: " + id);
            }
        } catch (Exception e) {
            return ApiResponse.error("Failed to delete cabinet: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<CabinetTypeDto>> getCabinetsByCategory(Long categoryId) {
        try {
            List<CabinetType> cabinets = cabinetTypeRepository.findByCategoryId(categoryId);
            List<CabinetTypeDto> cabinetDtos = cabinets.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            return ApiResponse.success("Cabinets by category retrieved successfully", cabinetDtos);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve cabinets by category: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<CabinetTypeDto>> getCabinetsByBrand(Long brandId) {
        try {
            List<CabinetType> cabinets = cabinetTypeRepository.findByBrandId(brandId);
            List<CabinetTypeDto> cabinetDtos = cabinets.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            return ApiResponse.success("Cabinets by brand retrieved successfully", cabinetDtos);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve cabinets by brand: " + e.getMessage());
        }
    }

    private CabinetTypeDto convertToDto(CabinetType cabinet) {
        CabinetTypeDto dto = new CabinetTypeDto();
        dto.setId(cabinet.getId());
        dto.setName(cabinet.getName());
        dto.setCategoryId(cabinet.getCategory() != null ? cabinet.getCategory().getId() : null);
        dto.setCategoryName(cabinet.getCategory() != null ? cabinet.getCategory().getName() : null);
        dto.setBrandId(cabinet.getBrand() != null ? cabinet.getBrand().getId() : null);
        dto.setBrandName(cabinet.getBrand() != null ? cabinet.getBrand().getName() : null);
        dto.setMaterialId(cabinet.getMaterial() != null ? cabinet.getMaterial().getId() : null);
        dto.setMaterialName(cabinet.getMaterial() != null ? cabinet.getMaterial().getName() : null);
        dto.setBasePrice(cabinet.getBasePrice());
        dto.setMrp(cabinet.getMrp());
        dto.setDiscountPercentage(cabinet.getDiscountPercentage());
        dto.setCompanyPrice(cabinet.getCompanyPrice());
        dto.setActive(cabinet.getActive());
        dto.setCreatedAt(cabinet.getCreatedAt());
        dto.setUpdatedAt(cabinet.getUpdatedAt());
        return dto;
    }

    private CabinetType convertToEntity(CabinetTypeDto dto) {
        CabinetType cabinet = new CabinetType();
        cabinet.setName(dto.getName());
        cabinet.setBasePrice(dto.getBasePrice());
        cabinet.setMrp(dto.getMrp());
        cabinet.setDiscountPercentage(dto.getDiscountPercentage());
        cabinet.setActive(dto.getActive() != null ? dto.getActive() : true);

        // Set relationships
        if (dto.getCategoryId() != null) {
            categoryRepository.findById(dto.getCategoryId()).ifPresent(cabinet::setCategory);
        }
        if (dto.getBrandId() != null) {
            brandRepository.findById(dto.getBrandId()).ifPresent(cabinet::setBrand);
        }
        if (dto.getMaterialId() != null) {
            materialRepository.findById(dto.getMaterialId()).ifPresent(cabinet::setMaterial);
        }

        return cabinet;
    }

    private void updateEntityFromDto(CabinetType cabinet, CabinetTypeDto dto) {
        cabinet.setName(dto.getName());
        cabinet.setBasePrice(dto.getBasePrice());
        cabinet.setMrp(dto.getMrp());
        cabinet.setDiscountPercentage(dto.getDiscountPercentage());
        cabinet.setActive(dto.getActive());

        // Update relationships
        if (dto.getCategoryId() != null) {
            categoryRepository.findById(dto.getCategoryId()).ifPresent(cabinet::setCategory);
        } else {
            cabinet.setCategory(null);
        }

        if (dto.getBrandId() != null) {
            brandRepository.findById(dto.getBrandId()).ifPresent(cabinet::setBrand);
        } else {
            cabinet.setBrand(null);
        }

        if (dto.getMaterialId() != null) {
            materialRepository.findById(dto.getMaterialId()).ifPresent(cabinet::setMaterial);
        } else {
            cabinet.setMaterial(null);
        }
    }
}