package com.fleetmanagement.kitchencrmbackend.modules.vendor.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.dto.VendorCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.dto.VendorDto;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.dto.VendorUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vendors")
@CrossOrigin(origins = "*", maxAge = 3600)
public class VendorController {

    @Autowired
    private VendorService vendorService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<VendorDto>>> getAllVendors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "vendorName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return ResponseEntity.ok(vendorService.getAllVendors(pageable));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<VendorDto>>> getActiveVendors() {
        return ResponseEntity.ok(vendorService.getActiveVendors());
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<VendorDto>>> searchVendors(
            @RequestParam String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "vendorName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return ResponseEntity.ok(vendorService.searchVendors(searchTerm, pageable));
    }

    @GetMapping("/type/{vendorType}")
    public ResponseEntity<ApiResponse<List<VendorDto>>> getVendorsByType(@PathVariable String vendorType) {
        return ResponseEntity.ok(vendorService.getVendorsByType(vendorType));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VendorDto>> getVendorById(@PathVariable Long id) {
        ApiResponse<VendorDto> response = vendorService.getVendorById(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VendorDto>> createVendor(@Valid @RequestBody VendorCreateDto vendorCreateDto) {
        ApiResponse<VendorDto> response = vendorService.createVendor(vendorCreateDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VendorDto>> updateVendor(
            @PathVariable Long id,
            @Valid @RequestBody VendorUpdateDto vendorUpdateDto) {
        ApiResponse<VendorDto> response = vendorService.updateVendor(id, vendorUpdateDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteVendor(@PathVariable Long id) {
        ApiResponse<String> response = vendorService.deleteVendor(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}






