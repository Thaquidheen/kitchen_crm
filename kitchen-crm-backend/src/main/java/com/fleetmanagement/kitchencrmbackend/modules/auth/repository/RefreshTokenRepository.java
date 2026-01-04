package com.fleetmanagement.kitchencrmbackend.modules.auth.repository;

import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.RefreshToken;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByTokenAndRevokedFalse(String token);

    List<RefreshToken> findByUserAndRevokedFalse(User user);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true, rt.updatedAt = CURRENT_TIMESTAMP WHERE rt.user = :user AND rt.revoked = false")
    int revokeAllUserTokens(@Param("user") User user);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true, rt.replacedBy = :newToken, rt.updatedAt = CURRENT_TIMESTAMP WHERE rt.token = :oldToken")
    int revokeAndReplace(@Param("oldToken") String oldToken, @Param("newToken") String newToken);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") Instant now);

    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.user = :user AND rt.revoked = false")
    long countActiveTokensByUser(@Param("user") User user);

    // For security: detect token reuse (refresh token rotation attack)
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.token = :token OR rt.replacedBy = :token")
    List<RefreshToken> findTokenFamily(@Param("token") String token);
}
