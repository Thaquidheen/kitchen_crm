package com.fleetmanagement.kitchencrmbackend.modules.notification.service;

import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.NotificationRequest;
import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.NotificationResponse;
import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.NotificationHistoryDto;
import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.NotificationType;

import java.util.List;

/**
 * Unified notification service that coordinates Email and WhatsApp notifications
 * Provides a single entry point for sending multi-channel notifications
 */
public interface NotificationService {

    /**
     * Send a notification through all configured channels (Email + WhatsApp)
     *
     * @param request the notification request containing all details
     * @return NotificationResponse with status of both channels
     */
    NotificationResponse sendNotification(NotificationRequest request);

    /**
     * Send a quotation signature request to the customer
     * Sends both email and WhatsApp with signing link
     *
     * @param quotationId the ID of the quotation
     * @return NotificationResponse with delivery status
     */
    NotificationResponse sendQuotationSignatureRequest(Long quotationId);

    /**
     * Send a signature reminder to the customer
     *
     * @param documentId the signed document ID
     * @param daysElapsed number of days since request was sent
     * @return NotificationResponse with delivery status
     */
    NotificationResponse sendSignatureReminder(Long documentId, int daysElapsed);

    /**
     * Send confirmation that signature was received
     *
     * @param documentId the signed document ID
     * @return NotificationResponse with delivery status
     */
    NotificationResponse sendSignatureConfirmation(Long documentId);

    /**
     * Send design approval request notification
     *
     * @param designPhaseId the design phase ID
     * @return NotificationResponse with delivery status
     */
    NotificationResponse sendDesignApprovalRequest(Long designPhaseId);

    /**
     * Send payment reminder notification
     *
     * @param customerId the customer ID
     * @param amount the pending amount
     * @return NotificationResponse with delivery status
     */
    NotificationResponse sendPaymentReminder(Long customerId, Double amount);

    /**
     * Get notification history for a specific reference
     *
     * @param referenceType type of reference (QUOTATION, DESIGN_PHASE, etc.)
     * @param referenceId ID of the reference
     * @return List of notification history
     */
    List<NotificationHistoryDto> getNotificationHistory(String referenceType, Long referenceId);

    /**
     * Get notification history for a specific customer
     *
     * @param customerId the customer ID
     * @return List of notification history
     */
    List<NotificationHistoryDto> getCustomerNotificationHistory(Long customerId);

    /**
     * Get all notifications of a specific type
     *
     * @param notificationType the notification type
     * @return List of notification history
     */
    List<NotificationHistoryDto> getNotificationsByType(NotificationType notificationType);

    /**
     * Retry a failed notification
     *
     * @param notificationLogId the notification log ID to retry
     * @return NotificationResponse with new delivery status
     */
    NotificationResponse retryNotification(Long notificationLogId);

    /**
     * Update notification status from webhook callbacks
     *
     * @param notificationLogId the notification log ID
     * @param channel the channel (EMAIL or WHATSAPP)
     * @param status the new status
     * @param timestamp the timestamp of the status update
     */
    void updateNotificationStatus(Long notificationLogId, String channel, String status, String timestamp);

    /**
     * Get delivery statistics for notifications
     *
     * @param startDate start date for statistics
     * @param endDate end date for statistics
     * @return Map with statistics (sent, delivered, failed, etc.)
     */
    java.util.Map<String, Object> getDeliveryStatistics(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
}
