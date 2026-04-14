package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.InnerPanelTypeDto;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.InnerPanelType;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.InnerPanelTypeRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InnerPanelTypeServiceImpl implements InnerPanelTypeService {

    @Autowired
    private InnerPanelTypeRepository repository;

    @Override
    public ApiResponse<List<InnerPanelTypeDto>> getAllInnerPanelTypes() {
        List<InnerPanelTypeDto> dtos = repository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<List<InnerPanelTypeDto>> getActiveInnerPanelTypes() {
        List<InnerPanelTypeDto> dtos = repository.findByActiveTrue().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<InnerPanelTypeDto> getInnerPanelTypeById(Long id) {
        InnerPanelType entity = repository.findById(id).orElse(null);
        if (entity == null) {
            return ApiResponse.error("Inner panel type not found");
        }
        return ApiResponse.success(convertToDto(entity));
    }

    @Override
    public ApiResponse<InnerPanelTypeDto> createInnerPanelType(InnerPanelTypeDto dto) {
        if (repository.existsByName(dto.getName())) {
            return ApiResponse.error("Inner panel type name already exists");
        }
        InnerPanelType entity = convertToEntity(dto);
        InnerPanelType saved = repository.save(entity);
        return ApiResponse.success("Inner panel type created successfully", convertToDto(saved));
    }

    @Override
    public ApiResponse<InnerPanelTypeDto> updateInnerPanelType(Long id, InnerPanelTypeDto dto) {
        InnerPanelType existing = repository.findById(id).orElse(null);
        if (existing == null) {
            return ApiResponse.error("Inner panel type not found");
        }

        if (!existing.getName().equals(dto.getName()) && repository.existsByName(dto.getName())) {
            return ApiResponse.error("Inner panel type name already exists");
        }

        existing.setName(dto.getName());
        existing.setRatePerSqft(dto.getRatePerSqft());
        existing.setMultiplier(dto.getMultiplier());
        existing.setDescription(dto.getDescription());
        existing.setActive(dto.getActive());

        InnerPanelType updated = repository.save(existing);
        return ApiResponse.success("Inner panel type updated successfully", convertToDto(updated));
    }

    @Override
    public ApiResponse<String> deleteInnerPanelType(Long id) {
        InnerPanelType entity = repository.findById(id).orElse(null);
        if (entity == null) {
            return ApiResponse.error("Inner panel type not found");
        }
        repository.delete(entity);
        return ApiResponse.success("Inner panel type deleted successfully");
    }

    private InnerPanelTypeDto convertToDto(InnerPanelType entity) {
        return new InnerPanelTypeDto(
                entity.getId(),
                entity.getName(),
                entity.getRatePerSqft(),
                entity.getMultiplier(),
                entity.getDescription(),
                entity.getActive()
        );
    }

    private InnerPanelType convertToEntity(InnerPanelTypeDto dto) {
        InnerPanelType entity = new InnerPanelType();
        entity.setName(dto.getName());
        entity.setRatePerSqft(dto.getRatePerSqft());
        entity.setMultiplier(dto.getMultiplier() != null ? dto.getMultiplier() : BigDecimal.ONE);
        entity.setDescription(dto.getDescription());
        entity.setActive(dto.getActive() != null ? dto.getActive() : true);
        return entity;
    }
}
