package com.fleetmanagement.kitchencrmbackend.modules.signature.repository;

import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureAuditLog;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignedDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for SignatureAuditLog entity
 * Handles database operations for signature audit trail
 */
@Repository
public interface SignatureAuditLogRepository extends JpaRepository<SignatureAuditLog, Long> {

    /**
     * Find all audit logs for a specific signed document
     */
    @Query("SELECT sal FROM SignatureAuditLog sal " +
           "LEFT JOIN FETCH sal.signedDocument " +
           "WHERE sal.signedDocument.id = :signedDocumentId " +
           "ORDER BY sal.createdAt ASC")
    List<SignatureAuditLog> findBySignedDocumentId(@Param("signedDocumentId") Long signedDocumentId);

    /**
     * Find all audit logs for a specific signed document (desc order)
     */
    List<SignatureAuditLog> findBySignedDocumentOrderByCreatedAtDesc(SignedDocument signedDocument);

    /**
     * Find audit logs by event type
     */
    List<SignatureAuditLog> findByEventTypeOrderByCreatedAtDesc(String eventType);

    /**
     * Find audit logs within a date range
     */
    @Query("SELECT sal FROM SignatureAuditLog sal " +
           "WHERE sal.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY sal.createdAt DESC")
    List<SignatureAuditLog> findByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find audit logs by IP address
     */
    List<SignatureAuditLog> findByIpAddressOrderByCreatedAtDesc(String ipAddress);

    /**
     * Find customer-initiated events (no admin user)
     */
    @Query("SELECT sal FROM SignatureAuditLog sal " +
           "WHERE sal.performedByUserId IS NULL " +
           "ORDER BY sal.createdAt DESC")
    List<SignatureAuditLog> findCustomerEvents();

    /**
     * Find admin-initiated events
     */
    @Query("SELECT sal FROM SignatureAuditLog sal " +
           "WHERE sal.performedByUserId IS NOT NULL " +
           "ORDER BY sal.createdAt DESC")
    List<SignatureAuditLog> findAdminEvents();

    /**
     * Find events by specific admin user
     */
    List<SignatureAuditLog> findByPerformedByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Find events for a signed document by event type
     */
    @Query("SELECT sal FROM SignatureAuditLog sal " +
           "WHERE sal.signedDocument.id = :signedDocumentId " +
           "AND sal.eventType = :eventType " +
           "ORDER BY sal.createdAt ASC")
    List<SignatureAuditLog> findBySignedDocumentAndEventType(
        @Param("signedDocumentId") Long signedDocumentId,
        @Param("eventType") String eventType
    );

    /**
     * Get most recent event for a signed document
     */
    @Query("SELECT sal FROM SignatureAuditLog sal " +
           "WHERE sal.signedDocument.id = :signedDocumentId " +
           "ORDER BY sal.createdAt DESC")
    List<SignatureAuditLog> findMostRecentBySignedDocument(@Param("signedDocumentId") Long signedDocumentId);

    /**
     * Count events by type within a date range
     */
    @Query("SELECT COUNT(sal) FROM SignatureAuditLog sal " +
           "WHERE sal.eventType = :eventType " +
           "AND sal.createdAt BETWEEN :startDate AND :endDate")
    Long countByEventTypeAndDateRange(
        @Param("eventType") String eventType,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find events by device type
     */
    List<SignatureAuditLog> findByDeviceTypeOrderByCreatedAtDesc(String deviceType);

    /**
     * Find events by browser
     */
    List<SignatureAuditLog> findByBrowserOrderByCreatedAtDesc(String browser);

    /**
     * Get event statistics by type
     */
    @Query("SELECT sal.eventType, COUNT(sal) " +
           "FROM SignatureAuditLog sal " +
           "WHERE sal.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY sal.eventType " +
           "ORDER BY COUNT(sal) DESC")
    List<Object[]> getEventStatisticsByType(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Get device statistics
     */
    @Query("SELECT sal.deviceType, COUNT(sal) " +
           "FROM SignatureAuditLog sal " +
           "WHERE sal.deviceType IS NOT NULL " +
           "AND sal.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY sal.deviceType")
    List<Object[]> getDeviceStatistics(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Get browser statistics
     */
    @Query("SELECT sal.browser, COUNT(sal) " +
           "FROM SignatureAuditLog sal " +
           "WHERE sal.browser IS NOT NULL " +
           "AND sal.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY sal.browser")
    List<Object[]> getBrowserStatistics(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find all events for a signed document within time range
     */
    @Query("SELECT sal FROM SignatureAuditLog sal " +
           "WHERE sal.signedDocument.id = :signedDocumentId " +
           "AND sal.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY sal.createdAt ASC")
    List<SignatureAuditLog> findBySignedDocumentAndDateRange(
        @Param("signedDocumentId") Long signedDocumentId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Check if event type already exists for a signed document
     */
    @Query("SELECT COUNT(sal) > 0 FROM SignatureAuditLog sal " +
           "WHERE sal.signedDocument.id = :signedDocumentId " +
           "AND sal.eventType = :eventType")
    boolean existsBySignedDocumentAndEventType(
        @Param("signedDocumentId") Long signedDocumentId,
        @Param("eventType") String eventType
    );

    /**
     * Find suspicious activity (multiple IPs for same document)
     */
    @Query("SELECT sal.signedDocument.id, COUNT(DISTINCT sal.ipAddress) " +
           "FROM SignatureAuditLog sal " +
           "WHERE sal.ipAddress IS NOT NULL " +
           "GROUP BY sal.signedDocument.id " +
           "HAVING COUNT(DISTINCT sal.ipAddress) > 2")
    List<Object[]> findDocumentsWithMultipleIPs();

    /**
     * Get geographic distribution
     */
    @Query("SELECT sal.location, COUNT(sal) " +
           "FROM SignatureAuditLog sal " +
           "WHERE sal.location IS NOT NULL " +
           "AND sal.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY sal.location " +
           "ORDER BY COUNT(sal) DESC")
    List<Object[]> getGeographicDistribution(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find complete audit trail for a signed document (for legal export)
     */
    @Query("SELECT sal FROM SignatureAuditLog sal " +
           "LEFT JOIN FETCH sal.signedDocument sd " +
           "WHERE sal.signedDocument.id = :signedDocumentId " +
           "ORDER BY sal.createdAt ASC")
    List<SignatureAuditLog> findCompleteAuditTrail(@Param("signedDocumentId") Long signedDocumentId);
}
