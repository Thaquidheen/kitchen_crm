package com.fleetmanagement.kitchencrmbackend.modules.vendor.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.dto.VendorCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.dto.VendorDto;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.dto.VendorUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.entity.Vendor;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VendorServiceImpl implements VendorService {

    @Autowired
    private VendorRepository vendorRepository;

    @Override
    public ApiResponse<Page<VendorDto>> getAllVendors(Pageable pageable) {
        Page<Vendor> vendors = vendorRepository.findAll(pageable);
        Page<VendorDto> vendorDtos = vendors.map(this::convertToDto);
        return ApiResponse.success(vendorDtos);
    }

    @Override
    public ApiResponse<List<VendorDto>> getActiveVendors() {
        List<Vendor> vendors = vendorRepository.findByActiveTrue();
        List<VendorDto> vendorDtos = vendors.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(vendorDtos);
    }

    @Override
    public ApiResponse<VendorDto> getVendorById(Long id) {
        Vendor vendor = vendorRepository.findById(id).orElse(null);
        if (vendor == null) {
            return ApiResponse.error("Vendor not found");
        }
        return ApiResponse.success(convertToDto(vendor));
    }

    @Override
    public ApiResponse<VendorDto> createVendor(VendorCreateDto vendorCreateDto) {
        Vendor vendor = new Vendor();
        vendor.setVendorName(vendorCreateDto.getVendorName());
        vendor.setContactPerson(vendorCreateDto.getContactPerson());
        vendor.setPhone(vendorCreateDto.getPhone());
        vendor.setEmail(vendorCreateDto.getEmail());
        vendor.setAddress(vendorCreateDto.getAddress());
        vendor.setVendorType(Vendor.VendorType.valueOf(vendorCreateDto.getVendorType()));
        vendor.setActive(vendorCreateDto.getActive() != null ? vendorCreateDto.getActive() : true);
        vendor.setNotes(vendorCreateDto.getNotes());

        Vendor saved = vendorRepository.save(vendor);
        return ApiResponse.success("Vendor created successfully", convertToDto(saved));
    }

    @Override
    public ApiResponse<VendorDto> updateVendor(Long id, VendorUpdateDto vendorUpdateDto) {
        Vendor vendor = vendorRepository.findById(id).orElse(null);
        if (vendor == null) {
            return ApiResponse.error("Vendor not found");
        }

        if (vendorUpdateDto.getVendorName() != null) {
            vendor.setVendorName(vendorUpdateDto.getVendorName());
        }
        if (vendorUpdateDto.getContactPerson() != null) {
            vendor.setContactPerson(vendorUpdateDto.getContactPerson());
        }
        if (vendorUpdateDto.getPhone() != null) {
            vendor.setPhone(vendorUpdateDto.getPhone());
        }
        if (vendorUpdateDto.getEmail() != null) {
            vendor.setEmail(vendorUpdateDto.getEmail());
        }
        if (vendorUpdateDto.getAddress() != null) {
            vendor.setAddress(vendorUpdateDto.getAddress());
        }
        if (vendorUpdateDto.getVendorType() != null) {
            vendor.setVendorType(Vendor.VendorType.valueOf(vendorUpdateDto.getVendorType()));
        }
        if (vendorUpdateDto.getActive() != null) {
            vendor.setActive(vendorUpdateDto.getActive());
        }
        if (vendorUpdateDto.getNotes() != null) {
            vendor.setNotes(vendorUpdateDto.getNotes());
        }

        Vendor updated = vendorRepository.save(vendor);
        return ApiResponse.success("Vendor updated successfully", convertToDto(updated));
    }

    @Override
    public ApiResponse<String> deleteVendor(Long id) {
        Vendor vendor = vendorRepository.findById(id).orElse(null);
        if (vendor == null) {
            return ApiResponse.error("Vendor not found");
        }

        // Soft delete
        vendor.setActive(false);
        vendorRepository.save(vendor);
        return ApiResponse.success("Vendor deleted successfully");
    }

    @Override
    public ApiResponse<Page<VendorDto>> searchVendors(String searchTerm, Pageable pageable) {
        Page<Vendor> vendors = vendorRepository.findByVendorNameContainingIgnoreCase(searchTerm, pageable);
        Page<VendorDto> vendorDtos = vendors.map(this::convertToDto);
        return ApiResponse.success(vendorDtos);
    }

    @Override
    public ApiResponse<List<VendorDto>> getVendorsByType(String vendorType) {
        List<Vendor> vendors = vendorRepository.findByVendorType(Vendor.VendorType.valueOf(vendorType));
        List<VendorDto> vendorDtos = vendors.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(vendorDtos);
    }

    private VendorDto convertToDto(Vendor vendor) {
        VendorDto dto = new VendorDto();
        dto.setId(vendor.getId());
        dto.setVendorName(vendor.getVendorName());
        dto.setContactPerson(vendor.getContactPerson());
        dto.setPhone(vendor.getPhone());
        dto.setEmail(vendor.getEmail());
        dto.setAddress(vendor.getAddress());
        dto.setVendorType(vendor.getVendorType().name());
        dto.setActive(vendor.getActive());
        dto.setNotes(vendor.getNotes());
        dto.setCreatedAt(vendor.getCreatedAt());
        dto.setUpdatedAt(vendor.getUpdatedAt());
        return dto;
    }
}






