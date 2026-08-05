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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics(
            @RequestParam(required = false) ApplianceCustomer.Category category) {
        return ResponseEntity.ok(service.getStatistics(category));
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

    /** Attach or replace the quotation PDF for an entry. */
    @PostMapping(value = "/{id}/quotation", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ApplianceCustomerDto>> uploadQuotation(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        ApiResponse<ApplianceCustomerDto> response = service.uploadQuotation(id, file);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @DeleteMapping("/{id}/quotation")
    public ResponseEntity<ApiResponse<ApplianceCustomerDto>> deleteQuotation(@PathVariable Long id) {
        ApiResponse<ApplianceCustomerDto> response = service.deleteQuotation(id);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }
}
