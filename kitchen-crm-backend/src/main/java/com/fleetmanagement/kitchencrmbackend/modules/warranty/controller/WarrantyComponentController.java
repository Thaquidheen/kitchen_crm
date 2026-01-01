package com.fleetmanagement.kitchencrmbackend.modules.warranty.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.dto.WarrantyComponentDto;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.service.WarrantyComponentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/warranty-components")
@CrossOrigin(origins = "*")
public class WarrantyComponentController {

    @Autowired
    private WarrantyComponentService warrantyComponentService;

    @GetMapping
    public ApiResponse<List<WarrantyComponentDto>> getActiveComponents() {
        try {
            List<WarrantyComponentDto> components = warrantyComponentService.getAllActiveComponents();
            return ApiResponse.success("Warranty components retrieved successfully", components);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve warranty components: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<List<WarrantyComponentDto>> getAllComponents() {
        try {
            List<WarrantyComponentDto> components = warrantyComponentService.getAllComponents();
            return ApiResponse.success("All warranty components retrieved successfully", components);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve warranty components: " + e.getMessage());
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<WarrantyComponentDto> createComponent(@RequestBody WarrantyComponentDto dto) {
        try {
            WarrantyComponentDto created = warrantyComponentService.createComponent(dto);
            return ApiResponse.success("Warranty component created successfully", created);
        } catch (Exception e) {
            return ApiResponse.error("Failed to create warranty component: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<WarrantyComponentDto> updateComponent(@PathVariable Long id, @RequestBody WarrantyComponentDto dto) {
        try {
            WarrantyComponentDto updated = warrantyComponentService.updateComponent(id, dto);
            return ApiResponse.success("Warranty component updated successfully", updated);
        } catch (Exception e) {
            return ApiResponse.error("Failed to update warranty component: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<String> deleteComponent(@PathVariable Long id) {
        try {
            warrantyComponentService.deleteComponent(id);
            return ApiResponse.success("Warranty component deleted successfully", "Deleted");
        } catch (Exception e) {
            return ApiResponse.error("Failed to delete warranty component: " + e.getMessage());
        }
    }

    @PutMapping("/reorder")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<String> reorderComponents(@RequestBody List<Long> orderedIds) {
        try {
            warrantyComponentService.reorderComponents(orderedIds);
            return ApiResponse.success("Warranty components reordered successfully", "Reordered");
        } catch (Exception e) {
            return ApiResponse.error("Failed to reorder warranty components: " + e.getMessage());
        }
    }
}

