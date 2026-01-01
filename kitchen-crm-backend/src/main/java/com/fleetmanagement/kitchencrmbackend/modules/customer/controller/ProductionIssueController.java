package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionIssueCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionIssueDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionIssueUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionIssue;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.ProductionIssueService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/production/issues")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Production Issues", description = "APIs for managing production issues")
public class ProductionIssueController {

    private final ProductionIssueService issueService;

    @PostMapping
    @Operation(summary = "Create a new issue", description = "Reports a new production issue")
    public ResponseEntity<ApiResponse<ProductionIssueDto>> createIssue(
            @Valid @RequestBody ProductionIssueCreateDto createDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        log.info("Creating production issue for customer ID: {}", createDto.getCustomerId());
        ApiResponse<ProductionIssueDto> response = issueService.createIssue(createDto, currentUser.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{issueId}")
    @Operation(summary = "Get issue by ID", description = "Retrieves a specific issue by its ID")
    public ResponseEntity<ApiResponse<ProductionIssueDto>> getIssueById(@PathVariable Long issueId) {
        log.info("Fetching issue ID: {}", issueId);
        ApiResponse<ProductionIssueDto> response = issueService.getIssueById(issueId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get issues by customer ID", description = "Retrieves all issues for a customer")
    public ResponseEntity<ApiResponse<List<ProductionIssueDto>>> getIssuesByCustomer(@PathVariable Long customerId) {
        log.info("Fetching issues for customer ID: {}", customerId);
        ApiResponse<List<ProductionIssueDto>> response = issueService.getIssuesByCustomerId(customerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get issues by status", description = "Retrieves all issues with a specific status")
    public ResponseEntity<ApiResponse<List<ProductionIssueDto>>> getIssuesByStatus(
            @PathVariable ProductionIssue.IssueStatus status) {
        log.info("Fetching issues with status: {}", status);
        ApiResponse<List<ProductionIssueDto>> response = issueService.getIssuesByStatus(status);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{issueId}")
    @Operation(summary = "Update an issue", description = "Updates an existing issue")
    public ResponseEntity<ApiResponse<ProductionIssueDto>> updateIssue(
            @PathVariable Long issueId,
            @Valid @RequestBody ProductionIssueUpdateDto updateDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        log.info("Updating issue ID: {}", issueId);
        ApiResponse<ProductionIssueDto> response = issueService.updateIssue(issueId, updateDto, currentUser.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{issueId}/resolve")
    @Operation(summary = "Resolve an issue", description = "Marks an issue as resolved")
    public ResponseEntity<ApiResponse<ProductionIssueDto>> resolveIssue(
            @PathVariable Long issueId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        log.info("Resolving issue ID: {}", issueId);
        String resolution = body.get("resolution");
        ApiResponse<ProductionIssueDto> response = issueService.resolveIssue(issueId, resolution, currentUser.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{issueId}")
    @Operation(summary = "Delete an issue", description = "Deletes an issue")
    public ResponseEntity<ApiResponse<Void>> deleteIssue(@PathVariable Long issueId) {
        log.info("Deleting issue ID: {}", issueId);
        ApiResponse<Void> response = issueService.deleteIssue(issueId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/customer/{customerId}/count")
    @Operation(summary = "Count open issues", description = "Returns the count of open issues for a customer")
    public ResponseEntity<ApiResponse<Long>> countOpenIssues(@PathVariable Long customerId) {
        log.info("Counting open issues for customer ID: {}", customerId);
        ApiResponse<Long> response = issueService.countOpenIssuesByCustomerId(customerId);
        return ResponseEntity.ok(response);
    }
}
