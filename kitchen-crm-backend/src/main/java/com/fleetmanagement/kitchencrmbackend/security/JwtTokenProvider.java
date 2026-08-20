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

    /**
     * Validates a token for AUTHENTICATION. Signature and expiry alone are not enough: this key
     * also signs scoped tokens (see {@link #generateScopedToken}), and without a type check any of
     * those would authenticate as a bearer credential with its own, longer lifetime — outliving the
     * access-token expiry and surviving the logout blacklist, which keys on the access token value.
     *
     * A MISSING type is still accepted, so access tokens issued before the claim existed keep
     * working; only a token that declares a different type is refused.
     */
    public boolean validateToken(String authToken) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(getSigningKey())
                    .parseClaimsJws(authToken)
                    .getBody();
            Object type = claims.get("type");
            return type == null || "access".equals(type);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Mints a token that grants ONE named capability to one user for a short window — not a login.
     * Deliberately typed "scope" so {@link #validateToken} refuses it on the authentication path.
     */
    public String generateScopedToken(String scope, Long userId, long ttlMs) {
        return Jwts.builder()
                .setSubject(Long.toString(userId))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ttlMs))
                .claim("type", "scope")
                .claim("scope", scope)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    /** True only for an unexpired scoped token of exactly this scope, bound to exactly this user. */
    public boolean validateScopedToken(String token, String scope, Long userId) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(getSigningKey())
                    .parseClaimsJws(token)
                    .getBody();
            return "scope".equals(claims.get("type"))
                    && scope.equals(claims.get("scope"))
                    && userId != null
                    && userId.toString().equals(claims.getSubject());
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
