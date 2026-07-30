package com.fleetmanagement.kitchencrmbackend.modules.appliance.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.dto.ApplianceCustomerDto;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.entity.ApplianceCustomer;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.service.ApplianceCustomerService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/appliance-customers")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ApplianceCustomerController {

    @Autowired
    private ApplianceCustomerService service;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ApplianceCustomerDto>>> getAll(
            @RequestParam(required = false) ApplianceCustomer.Category category,
            @RequestParam(required = false) ApplianceCustomer.Status status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(service.getAll(category, status, search, pageable));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics() {
        return ResponseEntity.ok(service.getStatistics());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ApplianceCustomerDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ApplianceCustomerDto>> create(
            @Valid @RequestBody ApplianceCustomerDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(service.create(dto, currentUser != null ? currentUser.getName() : null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ApplianceCustomerDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody ApplianceCustomerDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        return ResponseEntity.ok(service.delete(id));
    }
}
