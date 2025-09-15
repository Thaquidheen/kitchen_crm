package com.fleetmanagement.kitchencrmbackend.modules.auth.service;

import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.LoginRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.LoginResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.SignupRequest;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;

public interface AuthService {
    ApiResponse<LoginResponse> authenticateUser(LoginRequest loginRequest);
    ApiResponse<String> registerUser(SignupRequest signUpRequest);
}