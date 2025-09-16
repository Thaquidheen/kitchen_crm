package com.fleetmanagement.kitchencrmbackend.modules.product.controller;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.CabinetTypeDto;
import com.fleetmanagement.kitchencrmbackend.modules.product.service.CabinetService;
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
@RequestMapping("/api/v1/cabinets")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CabinetController {

    @Autowired
    private CabinetService cabinetService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CabinetTypeDto>>> getAllCabinets(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long materialId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(cabinetService.getAllCabinets(name, categoryId, brandId, materialId, active, pageable));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<CabinetTypeDto>>> getActiveCabinets() {
        return ResponseEntity.ok(cabinetService.getActiveCabinets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CabinetTypeDto>> getCabinetById(@PathVariable Long id) {
        ApiResponse<CabinetTypeDto> response = cabinetService.getCabinetById(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CabinetTypeDto>> createCabinet(@Valid @RequestBody CabinetTypeDto cabinetDto) {
        ApiResponse<CabinetTypeDto> response = cabinetService.createCabinet(cabinetDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CabinetTypeDto>> updateCabinet(@PathVariable Long id,
                                                                     @Valid @RequestBody CabinetTypeDto cabinetDto) {
        ApiResponse<CabinetTypeDto> response = cabinetService.updateCabinet(id, cabinetDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteCabinet(@PathVariable Long id) {
        return ResponseEntity.ok(cabinetService.deleteCabinet(id));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<List<CabinetTypeDto>>> getCabinetsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(cabinetService.getCabinetsByCategory(categoryId));
    }

    @GetMapping("/brand/{brandId}")
    public ResponseEntity<ApiResponse<List<CabinetTypeDto>>> getCabinetsByBrand(@PathVariable Long brandId) {
        return ResponseEntity.ok(cabinetService.getCabinetsByBrand(brandId));
    }
}