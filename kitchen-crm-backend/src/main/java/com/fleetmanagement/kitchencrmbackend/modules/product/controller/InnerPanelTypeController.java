package com.fleetmanagement.kitchencrmbackend.modules.product.controller;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.InnerPanelTypeDto;
import com.fleetmanagement.kitchencrmbackend.modules.product.service.InnerPanelTypeService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inner-panels")
@CrossOrigin(origins = "*", maxAge = 3600)
public class InnerPanelTypeController {

    @Autowired
    private InnerPanelTypeService innerPanelTypeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<InnerPanelTypeDto>>> getAllInnerPanelTypes() {
        return ResponseEntity.ok(innerPanelTypeService.getAllInnerPanelTypes());
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<InnerPanelTypeDto>>> getActiveInnerPanelTypes() {
        return ResponseEntity.ok(innerPanelTypeService.getActiveInnerPanelTypes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InnerPanelTypeDto>> getInnerPanelTypeById(@PathVariable Long id) {
        ApiResponse<InnerPanelTypeDto> response = innerPanelTypeService.getInnerPanelTypeById(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<InnerPanelTypeDto>> createInnerPanelType(@Valid @RequestBody InnerPanelTypeDto dto) {
        ApiResponse<InnerPanelTypeDto> response = innerPanelTypeService.createInnerPanelType(dto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<InnerPanelTypeDto>> updateInnerPanelType(@PathVariable Long id,
                                                                                @Valid @RequestBody InnerPanelTypeDto dto) {
        ApiResponse<InnerPanelTypeDto> response = innerPanelTypeService.updateInnerPanelType(id, dto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteInnerPanelType(@PathVariable Long id) {
        return ResponseEntity.ok(innerPanelTypeService.deleteInnerPanelType(id));
    }
}
