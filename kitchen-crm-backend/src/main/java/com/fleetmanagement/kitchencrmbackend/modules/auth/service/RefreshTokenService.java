package com.fleetmanagement.kitchencrmbackend.modules.auth.service;

import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.RefreshToken;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;

import java.util.Optional;

public interface RefreshTokenService {

    RefreshToken createRefreshToken(User user, String deviceInfo, String ipAddress);

    Optional<RefreshToken> findByToken(String token);

    RefreshToken rotateRefreshToken(RefreshToken oldToken, String deviceInfo, String ipAddress);

    void revokeToken(String token);

    void revokeAllUserTokens(User user);

    boolean validateRefreshToken(String token);

    void deleteExpiredTokens();
}
