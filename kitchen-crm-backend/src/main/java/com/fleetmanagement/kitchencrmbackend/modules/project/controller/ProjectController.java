package com.fleetmanagement.kitchencrmbackend.modules.project.controller;

import com.fleetmanagement.kitchencrmbackend.modules.project.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import com.fleetmanagement.kitchencrmbackend.modules.project.service.ProjectService;
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
@RequestMapping("/api/v1/projects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProjectSummaryDto>>> getAllProjects(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) CustomerProject.ProjectStatus status,
            @RequestParam(required = false) String projectName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(projectService.getAllProjects(
                customerId, status, projectName, fromDate, toDate, pageable));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProjectStatistics() {
        return ResponseEntity.ok(projectService.getProjectStatistics());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDto>> getProjectById(@PathVariable Long id) {
        ApiResponse<ProjectDto> response = projectService.getProjectById(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<ProjectSummaryDto>>> getProjectsByCustomer(
            @PathVariable Long customerId) {
        return ResponseEntity.ok(projectService.getProjectsByCustomer(customerId));
    }

    @GetMapping("/{id}/financial-summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProjectFinancialSummary(
            @PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectFinancialSummary(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(
            @Valid @RequestBody ProjectCreateDto projectCreateDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<ProjectDto> response = projectService.createProject(
                projectCreateDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/quotation/{quotationId}/convert")
    public ResponseEntity<ApiResponse<ProjectDto>> convertQuotationToProject(
            @PathVariable Long quotationId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<ProjectDto> response = projectService.convertQuotationToProject(
                quotationId, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectDto projectDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<ProjectDto> response = projectService.updateProject(
                id, projectDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteProject(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.deleteProject(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateProjectStatus(
            @PathVariable Long id,
            @RequestParam CustomerProject.ProjectStatus status,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(projectService.updateProjectStatus(
                id, status, currentUser.getName()));
    }
}