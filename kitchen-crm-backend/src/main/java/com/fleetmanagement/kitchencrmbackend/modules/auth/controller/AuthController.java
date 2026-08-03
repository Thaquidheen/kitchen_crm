package com.fleetmanagement.kitchencrmbackend.modules.auth.controller;

import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.ChangePasswordRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.ForgotPasswordRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.LoginRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.LoginResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.RefreshTokenRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.ResetPasswordRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.SignupRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.service.AuthService;
import com.fleetmanagement.kitchencrmbackend.security.JwtTokenProvider;
import com.fleetmanagement.kitchencrmbackend.security.TokenBlacklistService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    AuthService authService;

    @Autowired
    TokenBlacklistService tokenBlacklistService;

    @Autowired
    JwtTokenProvider jwtTokenProvider;

    @PostMapping("/signin")
    public ResponseEntity<ApiResponse<LoginResponse>> authenticateUser(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request) {

        String clientIp = getClientIp(request);

        String deviceInfo = request.getHeader("User-Agent");
        ApiResponse<LoginResponse> response = authService.authenticateUser(loginRequest, deviceInfo, clientIp);
        return ResponseEntity.ok(response);
    }

    /**
     * Provisions an account. Restricted to super admins: the request body accepts a role set,
     * and {@code "admin"} maps to ROLE_SUPER_ADMIN, so leaving this anonymous allowed anyone
     * reaching the server to make themselves a super admin. This is the enforcement point;
     * SecurityConfig excluding it from the anonymous list is defence in depth.
     *
     * <p>Day-to-day staff creation goes through the Staff page (POST /api/v1/users/staff),
     * which is also SUPER_ADMIN-only and always assigns ROLE_STAFF.
     */
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<String>> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        ApiResponse<String> response = authService.registerUser(signUpRequest);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest refreshRequest,
            HttpServletRequest request) {

        String clientIp = getClientIp(request);
        String deviceInfo = request.getHeader("User-Agent");

        ApiResponse<LoginResponse> response = authService.refreshAccessToken(
                refreshRequest.getRefreshToken(),
                deviceInfo,
                clientIp
        );

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(
            HttpServletRequest request,
            @RequestBody(required = false) RefreshTokenRequest refreshRequest) {

        String accessToken = getJwtFromRequest(request);
        String refreshToken = refreshRequest != null ? refreshRequest.getRefreshToken() : null;

        ApiResponse<String> response = authService.logout(accessToken, refreshToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<String>> logoutAllDevices(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized"));
        }

        ApiResponse<String> response = authService.logoutAllDevices(userPrincipal.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * Changes the signed-in user's own password. Requires authentication (it is outside the
     * anonymous list in SecurityConfig) and verifies the current password before applying the
     * new one. Until this existed, a password could only be set at account creation or via an
     * emailed reset link.
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized"));
        }

        ApiResponse<String> response = authService.changePassword(userPrincipal.getId(), request);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {

        ApiResponse<String> response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        ApiResponse<String> response = authService.resetPassword(request);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/validate-reset-token")
    public ResponseEntity<ApiResponse<Boolean>> validateResetToken(@RequestParam String token) {
        ApiResponse<Boolean> response = authService.validateResetToken(token);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
