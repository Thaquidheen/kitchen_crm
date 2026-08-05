package com.fleetmanagement.kitchencrmbackend.modules.auth.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.ResetStaffPasswordDto;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.UserCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.UserDto;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.UserUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.auth.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users/staff")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllStaff() {
        ApiResponse<List<UserDto>> response = userService.getAllStaff();
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> getStaffById(@PathVariable Long id) {
        ApiResponse<UserDto> response = userService.getStaffById(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> createStaff(@Valid @RequestBody UserCreateDto userCreateDto) {
        ApiResponse<UserDto> response = userService.createStaff(userCreateDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateDto userUpdateDto) {
        ApiResponse<UserDto> response = userService.updateStaff(id, userUpdateDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PatchMapping("/{id}/password")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> resetStaffPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetStaffPasswordDto dto) {
        ApiResponse<String> response = userService.resetStaffPassword(id, dto.getNewPassword());
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteStaff(@PathVariable Long id) {
        ApiResponse<String> response = userService.deleteStaff(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}







