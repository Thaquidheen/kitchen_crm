package com.fleetmanagement.kitchencrmbackend.modules.notification.repository;

import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.NotificationLog;
import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.NotificationType;
import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.ReferenceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for NotificationLog entity
 * Handles database operations for notification tracking
 */
@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {

    /**
     * Find all notifications for a specific customer
     */
    @Query("SELECT nl FROM NotificationLog nl " +
           "LEFT JOIN FETCH nl.customer " +
           "WHERE nl.customer.id = :customerId " +
           "ORDER BY nl.createdAt DESC")
    List<NotificationLog> findByCustomerId(@Param("customerId") Long customerId);

    /**
     * Find all notifications for a specific customer
     */
    List<NotificationLog> findByCustomerOrderByCreatedAtDesc(com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer customer);

    /**
     * Find notifications by reference type and ID
     */
    @Query("SELECT nl FROM NotificationLog nl " +
           "WHERE nl.referenceType = :referenceType " +
           "AND nl.referenceId = :referenceId " +
           "ORDER BY nl.createdAt DESC")
    List<NotificationLog> findByReferenceTypeAndReferenceId(
        @Param("referenceType") ReferenceType referenceType,
        @Param("referenceId") Long referenceId
    );

    /**
     * Find notifications by reference type and ID
     */
    List<NotificationLog> findByReferenceTypeAndReferenceIdOrderByCreatedAtDesc(
        ReferenceType referenceType,
        Long referenceId
    );

    /**
     * Find notifications for a specific signed document
     */
    @Query("SELECT nl FROM NotificationLog nl " +
           "LEFT JOIN FETCH nl.signedDocument " +
           "WHERE nl.signedDocument.id = :signedDocumentId " +
           "ORDER BY nl.createdAt DESC")
    List<NotificationLog> findBySignedDocumentId(@Param("signedDocumentId") Long signedDocumentId);

    /**
     * Find notifications by type
     */
    List<NotificationLog> findByNotificationTypeOrderByCreatedAtDesc(NotificationType notificationType);

    /**
     * Find notifications by provider message ID (for webhook updates)
     */
    Optional<NotificationLog> findByProviderMessageId(String providerMessageId);

    /**
     * Find failed email notifications
     */
    @Query("SELECT nl FROM NotificationLog nl " +
           "WHERE nl.emailSent = true " +
           "AND nl.emailBounced = true " +
           "ORDER BY nl.emailSentAt DESC")
    List<NotificationLog> findFailedEmailNotifications();

    /**
     * Find failed WhatsApp notifications
     */
    @Query("SELECT nl FROM NotificationLog nl " +
           "WHERE nl.whatsappSent = true " +
           "AND nl.whatsappFailed = true " +
           "ORDER BY nl.whatsappSentAt DESC")
    List<NotificationLog> findFailedWhatsAppNotifications();

    /**
     * Find notifications sent within a date range
     */
    @Query("SELECT nl FROM NotificationLog nl " +
           "WHERE nl.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY nl.createdAt DESC")
    List<NotificationLog> findByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find notifications sent within a date range
     */
    List<NotificationLog> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Find notifications that were sent but not delivered (email)
     */
    @Query("SELECT nl FROM NotificationLog nl " +
           "WHERE nl.emailSent = true " +
           "AND nl.emailDelivered = false " +
           "AND nl.emailBounced = false " +
           "AND nl.emailSentAt < :cutoffDate " +
           "ORDER BY nl.emailSentAt ASC")
    List<NotificationLog> findEmailSentButNotDelivered(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Find notifications that were sent but not delivered (WhatsApp)
     */
    @Query("SELECT nl FROM NotificationLog nl " +
           "WHERE nl.whatsappSent = true " +
           "AND nl.whatsappDelivered = false " +
           "AND nl.whatsappFailed = false " +
           "AND nl.whatsappSentAt < :cutoffDate " +
           "ORDER BY nl.whatsappSentAt ASC")
    List<NotificationLog> findWhatsAppSentButNotDelivered(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Get email delivery statistics
     */
    @Query("SELECT " +
           "COUNT(nl), " +
           "SUM(CASE WHEN nl.emailSent = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN nl.emailDelivered = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN nl.emailOpened = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN nl.emailClicked = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN nl.emailBounced = true THEN 1 ELSE 0 END) " +
           "FROM NotificationLog nl " +
           "WHERE nl.createdAt BETWEEN :startDate AND :endDate")
    Object[] getEmailStatistics(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Get WhatsApp delivery statistics
     */
    @Query("SELECT " +
           "COUNT(nl), " +
           "SUM(CASE WHEN nl.whatsappSent = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN nl.whatsappDelivered = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN nl.whatsappRead = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN nl.whatsappFailed = true THEN 1 ELSE 0 END) " +
           "FROM NotificationLog nl " +
           "WHERE nl.createdAt BETWEEN :startDate AND :endDate")
    Object[] getWhatsAppStatistics(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Count notifications by type and date range
     */
    @Query("SELECT COUNT(nl) FROM NotificationLog nl " +
           "WHERE nl.notificationType = :notificationType " +
           "AND nl.createdAt BETWEEN :startDate AND :endDate")
    Long countByTypeAndDateRange(
        @Param("notificationType") NotificationType notificationType,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find most recent notification for a reference
     */
    @Query("SELECT nl FROM NotificationLog nl " +
           "WHERE nl.referenceType = :referenceType " +
           "AND nl.referenceId = :referenceId " +
           "AND nl.notificationType = :notificationType " +
           "ORDER BY nl.createdAt DESC")
    List<NotificationLog> findMostRecentByReference(
        @Param("referenceType") ReferenceType referenceType,
        @Param("referenceId") Long referenceId,
        @Param("notificationType") NotificationType notificationType
    );

    /**
     * Check if notification was already sent
     */
    @Query("SELECT COUNT(nl) > 0 FROM NotificationLog nl " +
           "WHERE nl.referenceType = :referenceType " +
           "AND nl.referenceId = :referenceId " +
           "AND nl.notificationType = :notificationType " +
           "AND nl.customer.id = :customerId " +
           "AND nl.createdAt > :since")
    boolean existsRecentNotification(
        @Param("referenceType") ReferenceType referenceType,
        @Param("referenceId") Long referenceId,
        @Param("notificationType") NotificationType notificationType,
        @Param("customerId") Long customerId,
        @Param("since") LocalDateTime since
    );

    /**
     * Find emails that were opened (for engagement tracking)
     */
    @Query("SELECT nl FROM NotificationLog nl " +
           "WHERE nl.emailOpened = true " +
           "AND nl.emailOpenedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY nl.emailOpenedAt DESC")
    List<NotificationLog> findOpenedEmailsByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Get notification performance by type
     */
    @Query("SELECT nl.notificationType, " +
           "COUNT(nl), " +
           "AVG(CASE WHEN nl.emailDelivered = true THEN 1.0 ELSE 0.0 END), " +
           "AVG(CASE WHEN nl.whatsappDelivered = true THEN 1.0 ELSE 0.0 END) " +
           "FROM NotificationLog nl " +
           "WHERE nl.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY nl.notificationType")
    List<Object[]> getNotificationPerformanceByType(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}
