package com.fleetmanagement.kitchencrmbackend.modules.product.controller;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.AccessoryDto;
import com.fleetmanagement.kitchencrmbackend.modules.product.service.AccessoryService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accessories")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AccessoryController {

    @Autowired
    private AccessoryService accessoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AccessoryDto>>> getAllAccessories(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(accessoryService.getAllAccessories(name, categoryId, brandId, active, pageable));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<AccessoryDto>>> getActiveAccessories() {
        return ResponseEntity.ok(accessoryService.getActiveAccessories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccessoryDto>> getAccessoryById(@PathVariable Long id) {
        ApiResponse<AccessoryDto> response = accessoryService.getAccessoryById(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AccessoryDto>> createAccessory(@Valid @RequestBody AccessoryDto accessoryDto) {
        ApiResponse<AccessoryDto> response = accessoryService.createAccessory(accessoryDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AccessoryDto>> updateAccessory(@PathVariable Long id,
                                                                     @Valid @RequestBody AccessoryDto accessoryDto) {
        ApiResponse<AccessoryDto> response = accessoryService.updateAccessory(id, accessoryDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteAccessory(@PathVariable Long id) {
        return ResponseEntity.ok(accessoryService.deleteAccessory(id));
    }
}