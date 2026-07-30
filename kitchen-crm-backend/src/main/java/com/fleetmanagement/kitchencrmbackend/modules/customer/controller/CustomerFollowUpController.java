package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerFollowUpDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.CustomerFollowUpService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/followups")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CustomerFollowUpController {

    @Autowired
    private CustomerFollowUpService followUpService;

    @PostMapping
    public ResponseEntity<ApiResponse<CustomerFollowUpDto>> createFollowUp(
            @Valid @RequestBody CustomerFollowUpDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(followUpService.createFollowUp(dto, currentUser != null ? currentUser.getName() : null));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<CustomerFollowUpDto>>> getFollowUpsForCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(followUpService.getFollowUpsForCustomer(customerId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteFollowUp(@PathVariable Long id) {
        return ResponseEntity.ok(followUpService.deleteFollowUp(id));
    }
}
