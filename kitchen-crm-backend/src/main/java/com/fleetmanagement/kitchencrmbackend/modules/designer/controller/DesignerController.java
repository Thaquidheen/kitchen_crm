package com.fleetmanagement.kitchencrmbackend.modules.designer.controller;

import com.fleetmanagement.kitchencrmbackend.modules.designer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.designer.service.DesignerService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/v1/designers")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DesignerController {

    @Autowired
    private DesignerService designerService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DesignerDto>>> getAllDesigners(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(designerService.getAllDesigners(pageable));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<DesignerDto>>> getActiveDesigners() {
        return ResponseEntity.ok(designerService.getActiveDesigners());
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<DesignerDto>>> getAvailableDesigners() {
        return ResponseEntity.ok(designerService.getAvailableDesigners());
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDesignerStatistics() {
        return ResponseEntity.ok(designerService.getDesignerStatistics());
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<DesignerDto>>> searchDesigners(
            @RequestParam String query) {
        return ResponseEntity.ok(designerService.searchDesigners(query));
    }

    @GetMapping("/department/{department}")
    public ResponseEntity<ApiResponse<List<DesignerDto>>> getDesignersByDepartment(
            @PathVariable String department) {
        return ResponseEntity.ok(designerService.getDesignersByDepartment(department));
    }

    @GetMapping("/specialization/{specialization}")
    public ResponseEntity<ApiResponse<List<DesignerDto>>> getDesignersBySpecialization(
            @PathVariable String specialization) {
        return ResponseEntity.ok(designerService.getDesignersBySpecialization(specialization));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DesignerDto>> getDesignerById(@PathVariable Long id) {
        ApiResponse<DesignerDto> response = designerService.getDesignerById(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<ApiResponse<DesignerDto>> getDesignerByEmail(@PathVariable String email) {
        ApiResponse<DesignerDto> response = designerService.getDesignerByEmail(email);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DesignerDto>> createDesigner(
            @Valid @RequestBody DesignerCreateDto designerCreateDto) {

        ApiResponse<DesignerDto> response = designerService.createDesigner(designerCreateDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DesignerDto>> updateDesigner(
            @PathVariable Long id,
            @Valid @RequestBody DesignerUpdateDto designerUpdateDto) {

        ApiResponse<DesignerDto> response = designerService.updateDesigner(id, designerUpdateDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteDesigner(@PathVariable Long id) {
        ApiResponse<String> response = designerService.deleteDesigner(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> toggleDesignerStatus(@PathVariable Long id) {
        return ResponseEntity.ok(designerService.toggleDesignerStatus(id));
    }
}
