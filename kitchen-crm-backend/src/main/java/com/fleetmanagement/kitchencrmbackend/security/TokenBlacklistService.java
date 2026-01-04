package com.fleetmanagement.kitchencrmbackend.security;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    // In production, consider using Redis for distributed caching
    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    public void blacklistToken(String token, long expirationTimeMs) {
        blacklistedTokens.put(token, expirationTimeMs);
        // Clean up expired tokens periodically
        cleanupExpiredTokens();
    }

    public boolean isBlacklisted(String token) {
        Long expiration = blacklistedTokens.get(token);
        if (expiration == null) {
            return false;
        }
        // Token is in blacklist but has expired, remove it
        if (System.currentTimeMillis() > expiration) {
            blacklistedTokens.remove(token);
            return false;
        }
        return true;
    }

    private void cleanupExpiredTokens() {
        long currentTime = System.currentTimeMillis();
        blacklistedTokens.entrySet().removeIf(entry -> currentTime > entry.getValue());
    }
}
