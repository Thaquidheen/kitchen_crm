package com.fleetmanagement.kitchencrmbackend.modules.vendor.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.dto.VendorCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.dto.VendorDto;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.dto.VendorUpdateDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface VendorService {

    /**
     * Get all vendors with pagination
     */
    ApiResponse<Page<VendorDto>> getAllVendors(Pageable pageable);

    /**
     * Get all active vendors
     */
    ApiResponse<List<VendorDto>> getActiveVendors();

    /**
     * Get vendor by ID
     */
    ApiResponse<VendorDto> getVendorById(Long id);

    /**
     * Create new vendor
     */
    ApiResponse<VendorDto> createVendor(VendorCreateDto vendorCreateDto);

    /**
     * Update existing vendor
     */
    ApiResponse<VendorDto> updateVendor(Long id, VendorUpdateDto vendorUpdateDto);

    /**
     * Delete vendor (soft delete by setting active=false)
     */
    ApiResponse<String> deleteVendor(Long id);

    /**
     * Search vendors by name
     */
    ApiResponse<Page<VendorDto>> searchVendors(String searchTerm, Pageable pageable);

    /**
     * Get vendors by type
     */
    ApiResponse<List<VendorDto>> getVendorsByType(String vendorType);
}






