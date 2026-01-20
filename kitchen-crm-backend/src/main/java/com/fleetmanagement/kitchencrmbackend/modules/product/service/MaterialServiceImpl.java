package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.MaterialDto;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Material;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.CabinetTypeRepository;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.MaterialRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaterialServiceImpl implements MaterialService {

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private CabinetTypeRepository cabinetTypeRepository;

    @Override
    public ApiResponse<List<MaterialDto>> getAllMaterials() {
        List<Material> materials = materialRepository.findAll();
        List<MaterialDto> materialDtos = materials.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(materialDtos);
    }

    @Override
    public ApiResponse<List<MaterialDto>> getActiveMaterials() {
        List<Material> materials = materialRepository.findByActiveTrue();
        List<MaterialDto> materialDtos = materials.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(materialDtos);
    }

    @Override
    public ApiResponse<MaterialDto> getMaterialById(Long id) {
        Material material = materialRepository.findById(id).orElse(null);
        if (material == null) {
            return ApiResponse.error("Material not found");
        }
        return ApiResponse.success(convertToDto(material));
    }

    @Override
    public ApiResponse<MaterialDto> createMaterial(MaterialDto materialDto) {
        if (materialRepository.existsByName(materialDto.getName())) {
            return ApiResponse.error("Material name already exists");
        }

        Material material = convertToEntity(materialDto);
        Material savedMaterial = materialRepository.save(material);
        return ApiResponse.success("Material created successfully", convertToDto(savedMaterial));
    }

    @Override
    public ApiResponse<MaterialDto> updateMaterial(Long id, MaterialDto materialDto) {
        Material existingMaterial = materialRepository.findById(id).orElse(null);
        if (existingMaterial == null) {
            return ApiResponse.error("Material not found");
        }

        if (!existingMaterial.getName().equals(materialDto.getName()) &&
                materialRepository.existsByName(materialDto.getName())) {
            return ApiResponse.error("Material name already exists");
        }

        existingMaterial.setName(materialDto.getName());
        existingMaterial.setUnitRatePerSqft(materialDto.getUnitRatePerSqft());
        existingMaterial.setDescription(materialDto.getDescription());
        existingMaterial.setActive(materialDto.getActive());

        Material updatedMaterial = materialRepository.save(existingMaterial);
        return ApiResponse.success("Material updated successfully", convertToDto(updatedMaterial));
    }

    @Override
    public ApiResponse<String> deleteMaterial(Long id) {
        Material material = materialRepository.findById(id).orElse(null);
        if (material == null) {
            return ApiResponse.error("Material not found");
        }

        // Check if material is in use by any cabinet types
        if (!cabinetTypeRepository.findByMaterialId(id).isEmpty()) {
            return ApiResponse.error("Cannot delete material: It is being used by one or more cabinet types. Please remove the material from those cabinets first.");
        }

        materialRepository.delete(material);
        return ApiResponse.success("Material deleted successfully");
    }

    private MaterialDto convertToDto(Material material) {
        return new MaterialDto(
                material.getId(),
                material.getName(),
                material.getUnitRatePerSqft(),
                material.getDescription(),
                material.getActive()
        );
    }

    private Material convertToEntity(MaterialDto dto) {
        Material material = new Material();
        material.setName(dto.getName());
        material.setUnitRatePerSqft(dto.getUnitRatePerSqft());
        material.setDescription(dto.getDescription());
        material.setActive(dto.getActive() != null ? dto.getActive() : true);
        return material;
    }
}