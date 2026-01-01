package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerRequirementsCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerRequirementsDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerRequirementsUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.CustomerRequirementsService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customers/{customerId}/requirements")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CustomerRequirementsController {

    @Autowired
    private CustomerRequirementsService requirementsService;

    @GetMapping
    public ResponseEntity<ApiResponse<CustomerRequirementsDto>> getRequirements(
            @PathVariable Long customerId) {
        ApiResponse<CustomerRequirementsDto> response = requirementsService.getRequirementsByCustomerId(customerId);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CustomerRequirementsDto>> createRequirements(
            @PathVariable Long customerId,
            @Valid @RequestBody CustomerRequirementsCreateDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<CustomerRequirementsDto> response = requirementsService.createRequirements(
                customerId, dto, currentUser.getName());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping
    public ResponseEntity<ApiResponse<CustomerRequirementsDto>> updateRequirements(
            @PathVariable Long customerId,
            @Valid @RequestBody CustomerRequirementsUpdateDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApiResponse<CustomerRequirementsDto> response = requirementsService.updateRequirements(
                customerId, dto, currentUser.getName());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<String>> deleteRequirements(
            @PathVariable Long customerId) {
        return ResponseEntity.ok(requirementsService.deleteRequirements(customerId));
    }
}


