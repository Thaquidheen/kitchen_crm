package com.fleetmanagement.kitchencrmbackend.modules.auth.service;

import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.ForgotPasswordRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.LoginRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.LoginResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.ResetPasswordRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.SignupRequest;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.PasswordResetToken;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.RefreshToken;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.Role;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.PasswordResetTokenRepository;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.RoleRepository;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.modules.notification.service.EmailService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.security.JwtTokenProvider;
import com.fleetmanagement.kitchencrmbackend.security.TokenBlacklistService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JwtTokenProvider tokenProvider;

    @Autowired
    PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    EmailService emailService;

    @Autowired
    RefreshTokenService refreshTokenService;

    @Autowired
    TokenBlacklistService tokenBlacklistService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.auth.default-role:ROLE_STAFF}")
    private String defaultRoleName;

    private static final int RESET_TOKEN_EXPIRY_MINUTES = 30;

    @Override
    public ApiResponse<LoginResponse> authenticateUser(LoginRequest loginRequest, String deviceInfo, String ipAddress) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String accessToken = tokenProvider.generateToken(authentication);

            // Use the new method that fetches roles eagerly
            User user = userRepository.findByEmailWithRoles(loginRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Create refresh token
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user, deviceInfo, ipAddress);

            Set<String> roles = user.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toSet());

            LoginResponse loginResponse = LoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken.getToken())
                    .type("Bearer")
                    .expiresIn(tokenProvider.getAccessTokenExpirationSeconds())
                    .refreshExpiresIn(tokenProvider.getRefreshTokenExpirationSeconds())
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .roles(roles)
                    .build();

            return ApiResponse.success("Login successful", loginResponse);
        } catch (AuthenticationException e) {
            logger.warn("Authentication failed for user {}: {}", loginRequest.getEmail(), e.getMessage());
            return ApiResponse.error("Invalid email or password");
        }
    }

    @Override
    public ApiResponse<LoginResponse> refreshAccessToken(String refreshTokenString, String deviceInfo, String ipAddress) {
        try {
            // Validate refresh token
            if (!refreshTokenService.validateRefreshToken(refreshTokenString)) {
                return ApiResponse.error("Invalid or expired refresh token");
            }

            RefreshToken oldRefreshToken = refreshTokenService.findByToken(refreshTokenString)
                    .orElseThrow(() -> new RuntimeException("Refresh token not found"));

            User user = oldRefreshToken.getUser();

            // Rotate refresh token (security best practice)
            RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(oldRefreshToken, deviceInfo, ipAddress);

            // Generate new access token
            String newAccessToken = tokenProvider.generateAccessTokenForUser(user.getId());

            Set<String> roles = user.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toSet());

            LoginResponse response = LoginResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken.getToken())
                    .type("Bearer")
                    .expiresIn(tokenProvider.getAccessTokenExpirationSeconds())
                    .refreshExpiresIn(tokenProvider.getRefreshTokenExpirationSeconds())
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .roles(roles)
                    .build();

            logger.info("Token refreshed successfully for user: {}", user.getEmail());
            return ApiResponse.success("Token refreshed successfully", response);
        } catch (Exception e) {
            logger.error("Token refresh failed", e);
            return ApiResponse.error("Token refresh failed: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<String> logout(String accessToken, String refreshToken) {
        try {
            // Blacklist access token
            if (accessToken != null && tokenProvider.validateToken(accessToken)) {
                long expiration = tokenProvider.getExpirationFromToken(accessToken);
                tokenBlacklistService.blacklistToken(accessToken, expiration);
            }

            // Revoke refresh token
            if (refreshToken != null) {
                refreshTokenService.revokeToken(refreshToken);
            }

            return ApiResponse.success("Logged out successfully", null);
        } catch (Exception e) {
            logger.error("Logout failed", e);
            return ApiResponse.error("Logout failed");
        }
    }

    @Override
    public ApiResponse<String> logoutAllDevices(Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            refreshTokenService.revokeAllUserTokens(user);

            return ApiResponse.success("Logged out from all devices", null);
        } catch (Exception e) {
            logger.error("Logout all devices failed for user: {}", userId, e);
            return ApiResponse.error("Operation failed");
        }
    }

    @Override
    public ApiResponse<String> registerUser(SignupRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ApiResponse.error("Email is already taken!");
        }

        // Creating user's account
        User user = new User();
        user.setName(signUpRequest.getName());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));
        user.setPhoneNumber(signUpRequest.getPhoneNumber());

        Set<String> strRoles = signUpRequest.getRoles();
        Set<Role> roles = new HashSet<>();

        if (strRoles == null || strRoles.isEmpty()) {
            Role.RoleName defaultRole = Role.RoleName.valueOf(defaultRoleName);
            Role userRole = roleRepository.findByName(defaultRole)
                    .orElseThrow(() -> new RuntimeException("Error: Default role '" + defaultRoleName + "' is not found."));
            roles.add(userRole);
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                    case "admin":
                        Role adminRole = roleRepository.findByName(Role.RoleName.ROLE_SUPER_ADMIN)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(adminRole);
                        break;
                    default:
                        Role userRole = roleRepository.findByName(Role.RoleName.ROLE_STAFF)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(userRole);
                }
            });
        }

        user.setRoles(roles);
        userRepository.save(user);

        return ApiResponse.success("User registered successfully");
    }

    @Override
    public ApiResponse<String> forgotPassword(ForgotPasswordRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        // Always return success to prevent email enumeration attacks
        if (userOptional.isEmpty()) {
            logger.warn("Password reset requested for non-existent email: {}", request.getEmail());
            return ApiResponse.success("If your email is registered, you will receive a password reset link.");
        }

        User user = userOptional.get();

        // Delete any existing tokens for this user
        passwordResetTokenRepository.deleteByUser(user);

        // Generate new token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(token, user, RESET_TOKEN_EXPIRY_MINUTES);
        passwordResetTokenRepository.save(resetToken);

        // Send email
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String emailContent = buildPasswordResetEmail(user.getName(), resetLink);

        try {
            emailService.sendSimpleEmail(
                user.getEmail(),
                "Password Reset Request - HOCH Kitchen CRM",
                emailContent
            );
            logger.info("Password reset email sent to: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send password reset email to: {}", user.getEmail(), e);
            return ApiResponse.error("Failed to send password reset email. Please try again later.");
        }

        return ApiResponse.success("If your email is registered, you will receive a password reset link.");
    }

    @Override
    public ApiResponse<String> resetPassword(ResetPasswordRequest request) {
        Optional<PasswordResetToken> tokenOptional = passwordResetTokenRepository.findByToken(request.getToken());

        if (tokenOptional.isEmpty()) {
            return ApiResponse.error("Invalid or expired password reset token.");
        }

        PasswordResetToken resetToken = tokenOptional.get();

        if (!resetToken.isValid()) {
            return ApiResponse.error("Password reset token has expired. Please request a new one.");
        }

        // Update password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        logger.info("Password successfully reset for user: {}", user.getEmail());
        return ApiResponse.success("Password has been reset successfully. You can now login with your new password.");
    }

    @Override
    public ApiResponse<Boolean> validateResetToken(String token) {
        Optional<PasswordResetToken> tokenOptional = passwordResetTokenRepository.findByToken(token);

        if (tokenOptional.isEmpty() || !tokenOptional.get().isValid()) {
            return ApiResponse.error("Invalid or expired password reset token.");
        }

        return ApiResponse.success("Token is valid", true);
    }

    private String buildPasswordResetEmail(String userName, String resetLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>HOCH Kitchen CRM</h1>
                    </div>
                    <div class="content">
                        <h2>Password Reset Request</h2>
                        <p>Hello %s,</p>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button">Reset Password</a>
                        </p>
                        <p>This link will expire in 30 minutes.</p>
                        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                        <p>Best regards,<br>The HOCH Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, resetLink);
    }
}
