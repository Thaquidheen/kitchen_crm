package com.fleetmanagement.kitchencrmbackend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-expiration:900000}")
    private long accessTokenExpirationMs;

    @Value("${app.jwt.refresh-expiration:604800000}")
    private long refreshTokenExpirationMs;

    // Legacy support - fallback to old config
    @Value("${app.jwt.expiration:900000}")
    private long legacyExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return generateAccessTokenForUser(userPrincipal.getId());
    }

    public String generateAccessTokenForUser(Long userId) {
        long expirationMs = accessTokenExpirationMs > 0 ? accessTokenExpirationMs : legacyExpirationMs;
        Date expiryDate = new Date(System.currentTimeMillis() + expirationMs);

        return Jwts.builder()
                .setSubject(Long.toString(userId))
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .claim("type", "access")
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public Long getUserIdFromJWT(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(getSigningKey())
                .parseClaimsJws(token)
                .getBody();

        return Long.parseLong(claims.getSubject());
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parser()
                    .setSigningKey(getSigningKey())
                    .parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public long getExpirationFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(getSigningKey())
                    .parseClaimsJws(token)
                    .getBody();
            return claims.getExpiration().getTime();
        } catch (JwtException | IllegalArgumentException e) {
            return System.currentTimeMillis();
        }
    }

    public long getAccessTokenExpirationMs() {
        return accessTokenExpirationMs > 0 ? accessTokenExpirationMs : legacyExpirationMs;
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    public long getAccessTokenExpirationSeconds() {
        return getAccessTokenExpirationMs() / 1000;
    }

    public long getRefreshTokenExpirationSeconds() {
        return refreshTokenExpirationMs / 1000;
    }
}
