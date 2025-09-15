package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.BrandDto;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Brand;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.BrandRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BrandServiceImpl implements BrandService {

    @Autowired
    private BrandRepository brandRepository;

    @Override
    public ApiResponse<List<BrandDto>> getAllBrands() {
        List<Brand> brands = brandRepository.findAll();
        List<BrandDto> brandDtos = brands.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(brandDtos);
    }

    @Override
    public ApiResponse<List<BrandDto>> getActiveBrands() {
        List<Brand> brands = brandRepository.findByActiveTrue();
        List<BrandDto> brandDtos = brands.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(brandDtos);
    }

    @Override
    public ApiResponse<BrandDto> getBrandById(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElse(null);
        if (brand == null) {
            return ApiResponse.error("Brand not found");
        }
        return ApiResponse.success(convertToDto(brand));
    }

    @Override
    public ApiResponse<BrandDto> createBrand(BrandDto brandDto) {
        if (brandRepository.existsByName(brandDto.getName())) {
            return ApiResponse.error("Brand name already exists");
        }

        Brand brand = convertToEntity(brandDto);
        Brand savedBrand = brandRepository.save(brand);
        return ApiResponse.success("Brand created successfully", convertToDto(savedBrand));
    }

    @Override
    public ApiResponse<BrandDto> updateBrand(Long id, BrandDto brandDto) {
        Brand existingBrand = brandRepository.findById(id)
                .orElse(null);
        if (existingBrand == null) {
            return ApiResponse.error("Brand not found");
        }

        // Check if name already exists (excluding current brand)
        if (!existingBrand.getName().equals(brandDto.getName()) &&
                brandRepository.existsByName(brandDto.getName())) {
            return ApiResponse.error("Brand name already exists");
        }

        existingBrand.setName(brandDto.getName());
        existingBrand.setDescription(brandDto.getDescription());
        existingBrand.setActive(brandDto.getActive());

        Brand updatedBrand = brandRepository.save(existingBrand);
        return ApiResponse.success("Brand updated successfully", convertToDto(updatedBrand));
    }

    @Override
    public ApiResponse<String> deleteBrand(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElse(null);
        if (brand == null) {
            return ApiResponse.error("Brand not found");
        }

        // Soft delete - just mark as inactive
        brand.setActive(false);
        brandRepository.save(brand);
        return ApiResponse.success("Brand deleted successfully");
    }

    private BrandDto convertToDto(Brand brand) {
        return new BrandDto(
                brand.getId(),
                brand.getName(),
                brand.getDescription(),
                brand.getActive()
        );
    }

    private Brand convertToEntity(BrandDto brandDto) {
        Brand brand = new Brand();
        brand.setName(brandDto.getName());
        brand.setDescription(brandDto.getDescription());
        brand.setActive(brandDto.getActive() != null ? brandDto.getActive() : true);
        return brand;
    }
}