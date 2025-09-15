package com.fleetmanagement.kitchencrmbackend.modules.auth.controller;

import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.LoginRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.LoginResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.SignupRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.service.AuthService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    AuthService authService;

    @PostMapping("/signin")
    public ResponseEntity<ApiResponse<LoginResponse>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        ApiResponse<LoginResponse> response = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<String>> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        ApiResponse<String> response = authService.registerUser(signUpRequest);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}