package com.fleetmanagement.kitchencrmbackend.modules.measurement.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.measurement.dto.SiteMeasurementDto;
import com.fleetmanagement.kitchencrmbackend.modules.measurement.dto.SiteMeasurementSaveRequest;
import com.fleetmanagement.kitchencrmbackend.modules.measurement.service.SiteMeasurementService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Site Measurement Mode: a customer's room layout and measured values (mm + provenance). */
@RestController
@RequestMapping("/api/v1/site-measurements")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SiteMeasurementController {

    @Autowired
    private SiteMeasurementService service;

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<SiteMeasurementDto>> get(@PathVariable Long customerId) {
        return respond(service.getForCustomer(customerId));
    }

    @PutMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<SiteMeasurementDto>> save(
            @PathVariable Long customerId,
            @Valid @RequestBody SiteMeasurementSaveRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return respond(service.saveForCustomer(customerId, request,
                currentUser != null ? currentUser.getName() : null));
    }

    private static <T> ResponseEntity<ApiResponse<T>> respond(ApiResponse<T> r) {
        if (Boolean.TRUE.equals(r.getSuccess())) {
            return ResponseEntity.ok(r);
        }
        HttpStatus status = "Customer not found".equals(r.getMessage()) ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(r);
    }
}
