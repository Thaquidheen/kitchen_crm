package com.fleetmanagement.kitchencrmbackend.modules.permission.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.MyPermissionsDto;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.PermissionMatrixDto;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.PermissionSaveRequest;
import com.fleetmanagement.kitchencrmbackend.modules.permission.service.PermissionService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Permissions per staff type. Everyone can ask what they themselves may do (the screens hide the
 * rest); only a super admin sees and changes the whole table.
 */
@RestController
@RequestMapping("/api/v1/permissions")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PermissionController {

    @Autowired
    private PermissionService service;

    private static <T> ResponseEntity<ApiResponse<T>> respond(ApiResponse<T> r) {
        return Boolean.TRUE.equals(r.getSuccess()) ? ResponseEntity.ok(r) : ResponseEntity.badRequest().body(r);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MyPermissionsDto>> mine(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(service.mine(user)));
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PermissionMatrixDto>> matrix() {
        return ResponseEntity.ok(ApiResponse.success(service.matrix()));
    }

    @PutMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PermissionMatrixDto>> save(@RequestBody PermissionSaveRequest body,
                                                                 @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.save(body.getValues(), user));
    }
}
