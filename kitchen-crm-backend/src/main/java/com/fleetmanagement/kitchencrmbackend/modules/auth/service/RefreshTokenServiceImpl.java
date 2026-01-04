package com.fleetmanagement.kitchencrmbackend.modules.auth.service;

import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.RefreshToken;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private static final Logger logger = LoggerFactory.getLogger(RefreshTokenServiceImpl.class);
    private static final int MAX_ACTIVE_SESSIONS = 5;

    @Value("${app.jwt.refresh-expiration:604800000}")
    private long refreshTokenExpirationMs;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Override
    public RefreshToken createRefreshToken(User user, String deviceInfo, String ipAddress) {
        // Enforce maximum active sessions
        long activeTokens = refreshTokenRepository.countActiveTokensByUser(user);
        if (activeTokens >= MAX_ACTIVE_SESSIONS) {
            logger.info("User {} exceeded max sessions ({}), revoking old tokens", user.getEmail(), MAX_ACTIVE_SESSIONS);
            refreshTokenRepository.revokeAllUserTokens(user);
        }

        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(refreshTokenExpirationMs, ChronoUnit.MILLIS);

        RefreshToken refreshToken = new RefreshToken(token, user, expiresAt, deviceInfo, ipAddress);
        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByTokenAndRevokedFalse(token);
    }

    @Override
    public RefreshToken rotateRefreshToken(RefreshToken oldToken, String deviceInfo, String ipAddress) {
        // Create new token
        String newTokenString = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(refreshTokenExpirationMs, ChronoUnit.MILLIS);

        RefreshToken newToken = new RefreshToken(
                newTokenString,
                oldToken.getUser(),
                expiresAt,
                deviceInfo,
                ipAddress
        );

        // Mark old token as revoked and link to new token
        oldToken.setRevoked(true);
        oldToken.setReplacedBy(newTokenString);
        refreshTokenRepository.save(oldToken);

        return refreshTokenRepository.save(newToken);
    }

    @Override
    public void revokeToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(refreshToken -> {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            logger.info("Revoked refresh token for user: {}", refreshToken.getUser().getEmail());
        });
    }

    @Override
    public void revokeAllUserTokens(User user) {
        int revokedCount = refreshTokenRepository.revokeAllUserTokens(user);
        logger.info("Revoked {} refresh tokens for user: {}", revokedCount, user.getEmail());
    }

    @Override
    public boolean validateRefreshToken(String token) {
        Optional<RefreshToken> refreshTokenOpt = refreshTokenRepository.findByToken(token);

        if (refreshTokenOpt.isEmpty()) {
            logger.warn("Refresh token not found");
            return false;
        }

        RefreshToken rt = refreshTokenOpt.get();

        // Check if token is revoked (potential token reuse attack)
        if (rt.isRevoked()) {
            // Token was already used - this is a potential replay attack
            // Revoke entire token family for security
            logger.warn("Attempted reuse of revoked refresh token. Revoking entire token family for user: {}",
                    rt.getUser().getEmail());
            List<RefreshToken> tokenFamily = refreshTokenRepository.findTokenFamily(token);
            tokenFamily.forEach(t -> {
                t.setRevoked(true);
                refreshTokenRepository.save(t);
            });
            return false;
        }

        if (rt.isExpired()) {
            logger.warn("Refresh token expired for user: {}", rt.getUser().getEmail());
            return false;
        }

        return true;
    }

    @Override
    @Scheduled(cron = "0 0 2 * * ?") // Run at 2 AM daily
    public void deleteExpiredTokens() {
        int deletedCount = refreshTokenRepository.deleteExpiredTokens(Instant.now());
        if (deletedCount > 0) {
            logger.info("Cleaned up {} expired refresh tokens", deletedCount);
        }
    }
}
