package com.fleetmanagement.kitchencrmbackend.modules.signature.repository;

import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.DocumentType;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureStatus;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignedDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for SignedDocument entity
 * Handles database operations for signature/approval records
 */
@Repository
public interface SignedDocumentRepository extends JpaRepository<SignedDocument, Long> {

    /**
     * Find signed document by unique signing token
     */
    Optional<SignedDocument> findBySigningToken(String signingToken);

    /**
     * Find all signed documents for a specific customer
     */
    @Query("SELECT sd FROM SignedDocument sd " +
           "LEFT JOIN FETCH sd.customer " +
           "WHERE sd.customer.id = :customerId " +
           "ORDER BY sd.createdAt DESC")
    List<SignedDocument> findByCustomerId(@Param("customerId") Long customerId);

    /**
     * Find the most recent signed document for a given type and reference
     */
    Optional<SignedDocument> findTopByDocumentTypeAndReferenceIdOrderByCreatedAtDesc(DocumentType documentType, Long referenceId);

    /**
     * Find all signed documents by status
     */
    List<SignedDocument> findByStatusOrderByCreatedAtDesc(SignatureStatus status);

    /**
     * Find all signed documents by document type
     */
    List<SignedDocument> findByDocumentTypeOrderByCreatedAtDesc(DocumentType documentType);

    /**
     * Find documents that need reminders (SENT status, less than 2 reminders, not expired)
     */
    @Query("SELECT sd FROM SignedDocument sd " +
           "WHERE sd.status = 'SENT' " +
           "AND sd.reminderCount < 2 " +
           "AND sd.expiresAt > :now " +
           "AND ((sd.reminderCount = 0 AND sd.sentAt <= :threeDaysAgo) " +
           "     OR (sd.reminderCount = 1 AND sd.lastReminderAt <= :sixDaysFromStart)) " +
           "ORDER BY sd.sentAt ASC")
    List<SignedDocument> findDocumentsNeedingReminders(
        @Param("now") LocalDateTime now,
        @Param("threeDaysAgo") LocalDateTime threeDaysAgo,
        @Param("sixDaysFromStart") LocalDateTime sixDaysFromStart
    );

    /**
     * Find expired documents that haven't been marked as EXPIRED yet
     */
    @Query("SELECT sd FROM SignedDocument sd " +
           "WHERE sd.status IN ('PENDING', 'SENT', 'OPENED') " +
           "AND sd.expiresAt < :now")
    List<SignedDocument> findExpiredDocuments(@Param("now") LocalDateTime now);

    /**
     * Find documents sent to customer within a date range
     */
    @Query("SELECT sd FROM SignedDocument sd " +
           "WHERE sd.customer.id = :customerId " +
           "AND sd.sentAt BETWEEN :startDate AND :endDate " +
           "ORDER BY sd.sentAt DESC")
    List<SignedDocument> findByCustomerAndSentDateRange(
        @Param("customerId") Long customerId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find all signed documents within a date range
     */
    @Query("SELECT sd FROM SignedDocument sd " +
           "WHERE sd.signedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY sd.signedAt DESC")
    List<SignedDocument> findSignedDocumentsByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Count documents by status
     */
    Long countByStatus(SignatureStatus status);

    /**
     * Count documents by document type and status
     */
    Long countByDocumentTypeAndStatus(DocumentType documentType, SignatureStatus status);

    /**
     * Find pending or sent documents for a quotation
     */
    @Query("SELECT sd FROM SignedDocument sd " +
           "WHERE sd.documentType = :documentType " +
           "AND sd.referenceId = :referenceId " +
           "AND sd.status IN ('PENDING', 'SENT', 'OPENED') " +
           "ORDER BY sd.createdAt DESC")
    List<SignedDocument> findActiveDocumentsByTypeAndReference(
        @Param("documentType") DocumentType documentType,
        @Param("referenceId") Long referenceId
    );

    /**
     * Check if a customer has already signed a specific document
     */
    @Query("SELECT COUNT(sd) > 0 FROM SignedDocument sd " +
           "WHERE sd.documentType = :documentType " +
           "AND sd.referenceId = :referenceId " +
           "AND sd.customer.id = :customerId " +
           "AND sd.status = 'SIGNED'")
    boolean existsSignedDocument(
        @Param("documentType") DocumentType documentType,
        @Param("referenceId") Long referenceId,
        @Param("customerId") Long customerId
    );

    /**
     * Get statistics for dashboard
     */
    @Query("SELECT sd.status, COUNT(sd) FROM SignedDocument sd " +
           "WHERE sd.documentType = :documentType " +
           "GROUP BY sd.status")
    List<Object[]> getStatusStatisticsByDocumentType(@Param("documentType") DocumentType documentType);

    /**
     * Find documents that were opened but not signed within timeframe
     */
    @Query("SELECT sd FROM SignedDocument sd " +
           "WHERE sd.status = 'OPENED' " +
           "AND sd.openedAt < :cutoffDate " +
           "AND sd.expiresAt > :now " +
           "ORDER BY sd.openedAt ASC")
    List<SignedDocument> findOpenedButNotSigned(
        @Param("cutoffDate") LocalDateTime cutoffDate,
        @Param("now") LocalDateTime now
    );
}
