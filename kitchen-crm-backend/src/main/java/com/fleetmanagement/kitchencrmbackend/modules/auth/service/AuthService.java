package com.fleetmanagement.kitchencrmbackend.modules.auth.service;

import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.ForgotPasswordRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.LoginRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.LoginResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.ResetPasswordRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.SignupRequest;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;

public interface AuthService {
    ApiResponse<LoginResponse> authenticateUser(LoginRequest loginRequest, String deviceInfo, String ipAddress);
    ApiResponse<LoginResponse> refreshAccessToken(String refreshToken, String deviceInfo, String ipAddress);
    ApiResponse<String> registerUser(SignupRequest signUpRequest);
    ApiResponse<String> logout(String accessToken, String refreshToken);
    ApiResponse<String> logoutAllDevices(Long userId);
    ApiResponse<String> forgotPassword(ForgotPasswordRequest request);
    ApiResponse<String> resetPassword(ResetPasswordRequest request);
    ApiResponse<Boolean> validateResetToken(String token);
}
