package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionInstallation;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.ProductionInstallationService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/production-installation")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProductionInstallationController {

    @Autowired
    private ProductionInstallationService productionInstallationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductionInstallationDto>>> getAllProductionInstallations(
            @RequestParam(required = false) ProductionInstallation.InstallationStatus status,
            @RequestParam(required = false) String projectManager,
            @RequestParam(required = false) String teamLead,
            @RequestParam(required = false) String customerName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(productionInstallationService.getAllProductionInstallations(
                status, projectManager, teamLead, customerName, pageable));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductionInstallationStatistics() {
        return ResponseEntity.ok(productionInstallationService.getProductionInstallationStatistics());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<ProductionInstallationDto>> getProductionInstallationByCustomer(
            @PathVariable Long customerId) {
        ApiResponse<ProductionInstallationDto> response = productionInstallationService
                .getProductionInstallationByCustomer(customerId);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/customer/{customerId}/progress")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInstallationProgress(
            @PathVariable Long customerId) {
        return ResponseEntity.ok(productionInstallationService.getInstallationProgress(customerId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<ProductionInstallationDto>>> getInstallationsByStatus(
            @PathVariable ProductionInstallation.InstallationStatus status) {
        return ResponseEntity.ok(productionInstallationService.getInstallationsByStatus(status));
    }

    @GetMapping("/project-manager/{projectManager}")
    public ResponseEntity<ApiResponse<List<ProductionInstallationDto>>> getInstallationsByProjectManager(
            @PathVariable String projectManager) {
        return ResponseEntity.ok(productionInstallationService.getInstallationsByProjectManager(projectManager));
    }

    @GetMapping("/team-lead/{teamLead}")
    public ResponseEntity<ApiResponse<List<ProductionInstallationDto>>> getInstallationsByTeamLead(
            @PathVariable String teamLead) {
        return ResponseEntity.ok(productionInstallationService.getInstallationsByTeamLead(teamLead));
    }

    @GetMapping("/scheduled-completions")
    public ResponseEntity<ApiResponse<List<ProductionInstallationDto>>> getScheduledCompletions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(productionInstallationService.getScheduledCompletions(fromDate, toDate));
    }

    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<ProductionInstallationDto>>> getOverdueProjects() {
        return ResponseEntity.ok(productionInstallationService.getOverdueProjects());
    }

    @GetMapping("/ready-for-installation")
    public ResponseEntity<ApiResponse<List<ProductionInstallationDto>>> getReadyForInstallation() {
        return ResponseEntity.ok(productionInstallationService.getReadyForInstallation());
    }

    @GetMapping("/ready-for-handover")
    public ResponseEntity<ApiResponse<List<ProductionInstallationDto>>> getReadyForHandover() {
        return ResponseEntity.ok(productionInstallationService.getReadyForHandover());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductionInstallationDto>> createProductionInstallation(
            @Valid @RequestBody ProductionInstallationCreateDto createDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<ProductionInstallationDto> response = productionInstallationService
                .createProductionInstallation(createDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<ProductionInstallationDto>> updateProductionInstallation(
            @PathVariable Long customerId,
            @Valid @RequestBody ProductionInstallationDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<ProductionInstallationDto> response = productionInstallationService
                .updateProductionInstallation(customerId, dto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PatchMapping("/customer/{customerId}/task")
    public ResponseEntity<ApiResponse<String>> updateTaskStatus(
            @PathVariable Long customerId,
            @Valid @RequestBody TaskUpdateDto taskUpdateDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<String> response = productionInstallationService.updateTaskStatus(
                customerId, taskUpdateDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/customer/{customerId}/site-visit")
    public ResponseEntity<ApiResponse<String>> recordSiteVisit(
            @PathVariable Long customerId,
            @Valid @RequestBody SiteVisitDto siteVisitDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<String> response = productionInstallationService.recordSiteVisit(
                customerId, siteVisitDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/customer/{customerId}/quality-check")
    public ResponseEntity<ApiResponse<String>> recordQualityCheck(
            @PathVariable Long customerId,
            @Valid @RequestBody QualityCheckDto qualityCheckDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<String> response = productionInstallationService.recordQualityCheck(
                customerId, qualityCheckDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/customer/{customerId}/handover")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> completeHandover(
            @PathVariable Long customerId,
            @Valid @RequestBody HandoverDto handoverDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<String> response = productionInstallationService.completeHandover(
                customerId, handoverDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PatchMapping("/customer/{customerId}/status")
    public ResponseEntity<ApiResponse<String>> updateInstallationStatus(
            @PathVariable Long customerId,
            @RequestParam ProductionInstallation.InstallationStatus status,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(productionInstallationService.updateInstallationStatus(
                customerId, status, currentUser.getName()));
    }
}