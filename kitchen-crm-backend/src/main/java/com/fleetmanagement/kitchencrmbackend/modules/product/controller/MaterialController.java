package com.fleetmanagement.kitchencrmbackend.modules.product.controller;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.MaterialDto;
import com.fleetmanagement.kitchencrmbackend.modules.product.service.MaterialService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/materials")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MaterialController {

    @Autowired
    private MaterialService materialService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MaterialDto>>> getAllMaterials() {
        return ResponseEntity.ok(materialService.getAllMaterials());
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<MaterialDto>>> getActiveMaterials() {
        return ResponseEntity.ok(materialService.getActiveMaterials());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MaterialDto>> getMaterialById(@PathVariable Long id) {
        ApiResponse<MaterialDto> response = materialService.getMaterialById(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<MaterialDto>> createMaterial(@Valid @RequestBody MaterialDto materialDto) {
        ApiResponse<MaterialDto> response = materialService.createMaterial(materialDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<MaterialDto>> updateMaterial(@PathVariable Long id,
                                                                   @Valid @RequestBody MaterialDto materialDto) {
        ApiResponse<MaterialDto> response = materialService.updateMaterial(id, materialDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteMaterial(@PathVariable Long id) {
        return ResponseEntity.ok(materialService.deleteMaterial(id));
    }
}