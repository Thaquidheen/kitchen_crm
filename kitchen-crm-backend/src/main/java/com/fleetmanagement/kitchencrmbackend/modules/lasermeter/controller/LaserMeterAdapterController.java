package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.LaserMeterAdapterAuditDto;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.LaserMeterAdapterDto;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.LaserMeterAdapterRequest;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.service.LaserMeterService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Laser meter adapters. Any signed-in user can fetch the active ones (their device needs them to
 * talk to a meter); creating, changing and auditing adapters is admin-only.
 */
@RestController
@RequestMapping("/api/v1/laser-meter/adapters")
@CrossOrigin(origins = "*", maxAge = 3600)
public class LaserMeterAdapterController {

    @Autowired
    private LaserMeterService service;

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<LaserMeterAdapterDto>>> getActive() {
        return ResponseEntity.ok(service.getActiveAdapters());
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<LaserMeterAdapterDto>>> getAll() {
        return ResponseEntity.ok(service.getAllAdapters());
    }

    @GetMapping("/audit")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<LaserMeterAdapterAuditDto>>> getRecentAudit(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(service.getRecentAudit(limit));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<LaserMeterAdapterDto>> getOne(@PathVariable Long id) {
        return respond(service.getAdapter(id));
    }

    @GetMapping("/{id}/audit")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<LaserMeterAdapterAuditDto>>> getAudit(@PathVariable Long id) {
        return ResponseEntity.ok(service.getAdapterAudit(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<LaserMeterAdapterDto>> create(
            @Valid @RequestBody LaserMeterAdapterRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.createAdapter(request, email(user), name(user)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<LaserMeterAdapterDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody LaserMeterAdapterRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.updateAdapter(id, request, email(user), name(user)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.deleteAdapter(id, email(user), name(user)));
    }

    private static String email(UserPrincipal u) {
        return u != null ? u.getUsername() : null;
    }

    private static String name(UserPrincipal u) {
        return u != null ? u.getName() : null;
    }

    static <T> ResponseEntity<ApiResponse<T>> respond(ApiResponse<T> r) {
        if (Boolean.TRUE.equals(r.getSuccess())) {
            return ResponseEntity.ok(r);
        }
        boolean notFound = r.getMessage() != null && r.getMessage().endsWith("not found");
        return ResponseEntity.status(notFound ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST).body(r);
    }
}
