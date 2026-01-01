package com.fleetmanagement.kitchencrmbackend.modules.notification.controller;

import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.NotificationHistoryDto;
import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.NotificationRequest;
import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.NotificationResponse;
import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.NotificationType;
import com.fleetmanagement.kitchencrmbackend.modules.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for notification management
 * Provides endpoints for sending and tracking notifications
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Send a notification via multiple channels
     * POST /api/notifications/send
     */
    @PostMapping("/send")
    public ResponseEntity<NotificationResponse> sendNotification(
            @Valid @RequestBody NotificationRequest request) {

        log.info("REST: Sending notification - type: {}, customerId: {}",
            request.getNotificationType(), request.getCustomerId());

        try {
            NotificationResponse response = notificationService.sendNotification(request);

            HttpStatus status = response.isFullSuccess() ? HttpStatus.OK :
                response.isPartialSuccess() ? HttpStatus.PARTIAL_CONTENT :
                    HttpStatus.SERVICE_UNAVAILABLE;

            return ResponseEntity.status(status).body(response);

        } catch (Exception e) {
            log.error("Error sending notification: {}", e.getMessage(), e);

            NotificationResponse errorResponse = NotificationResponse.builder()
                .success(false)
                .message("Failed to send notification: " + e.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse);
        }
    }

    /**
     * Send quotation signature request
     * POST /api/notifications/quotation/{quotationId}/signature-request
     */
    @PostMapping("/quotation/{quotationId}/signature-request")
    public ResponseEntity<NotificationResponse> sendQuotationSignatureRequest(
            @PathVariable Long quotationId) {

        log.info("REST: Sending quotation signature request for quotationId: {}", quotationId);

        try {
            NotificationResponse response = notificationService
                .sendQuotationSignatureRequest(quotationId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error sending quotation signature request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(NotificationResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    /**
     * Send signature reminder
     * POST /api/notifications/document/{documentId}/signature-reminder
     */
    @PostMapping("/document/{documentId}/signature-reminder")
    public ResponseEntity<NotificationResponse> sendSignatureReminder(
            @PathVariable Long documentId,
            @RequestParam(defaultValue = "3") int daysElapsed) {

        log.info("REST: Sending signature reminder for documentId: {}, days: {}",
            documentId, daysElapsed);

        try {
            NotificationResponse response = notificationService
                .sendSignatureReminder(documentId, daysElapsed);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error sending signature reminder: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(NotificationResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    /**
     * Send signature confirmation
     * POST /api/notifications/document/{documentId}/signature-confirmation
     */
    @PostMapping("/document/{documentId}/signature-confirmation")
    public ResponseEntity<NotificationResponse> sendSignatureConfirmation(
            @PathVariable Long documentId) {

        log.info("REST: Sending signature confirmation for documentId: {}", documentId);

        try {
            NotificationResponse response = notificationService
                .sendSignatureConfirmation(documentId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error sending signature confirmation: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(NotificationResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    /**
     * Send design approval request
     * POST /api/notifications/design-phase/{designPhaseId}/approval-request
     */
    @PostMapping("/design-phase/{designPhaseId}/approval-request")
    public ResponseEntity<NotificationResponse> sendDesignApprovalRequest(
            @PathVariable Long designPhaseId) {

        log.info("REST: Sending design approval request for designPhaseId: {}", designPhaseId);

        try {
            NotificationResponse response = notificationService
                .sendDesignApprovalRequest(designPhaseId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error sending design approval request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(NotificationResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    /**
     * Send payment reminder
     * POST /api/notifications/customer/{customerId}/payment-reminder
     */
    @PostMapping("/customer/{customerId}/payment-reminder")
    public ResponseEntity<NotificationResponse> sendPaymentReminder(
            @PathVariable Long customerId,
            @RequestParam Double amount) {

        log.info("REST: Sending payment reminder for customerId: {}, amount: {}",
            customerId, amount);

        try {
            NotificationResponse response = notificationService
                .sendPaymentReminder(customerId, amount);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error sending payment reminder: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(NotificationResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    /**
     * Get notification history by reference
     * GET /api/notifications/history/reference
     */
    @GetMapping("/history/reference")
    public ResponseEntity<List<NotificationHistoryDto>> getNotificationHistory(
            @RequestParam String referenceType,
            @RequestParam Long referenceId) {

        log.info("REST: Getting notification history - referenceType: {}, referenceId: {}",
            referenceType, referenceId);

        try {
            List<NotificationHistoryDto> history = notificationService
                .getNotificationHistory(referenceType, referenceId);

            return ResponseEntity.ok(history);

        } catch (Exception e) {
            log.error("Error getting notification history: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get customer notification history
     * GET /api/notifications/history/customer/{customerId}
     */
    @GetMapping("/history/customer/{customerId}")
    public ResponseEntity<List<NotificationHistoryDto>> getCustomerNotificationHistory(
            @PathVariable Long customerId) {

        log.info("REST: Getting customer notification history for customerId: {}", customerId);

        try {
            List<NotificationHistoryDto> history = notificationService
                .getCustomerNotificationHistory(customerId);

            return ResponseEntity.ok(history);

        } catch (Exception e) {
            log.error("Error getting customer notification history: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get notifications by type
     * GET /api/notifications/history/type/{notificationType}
     */
    @GetMapping("/history/type/{notificationType}")
    public ResponseEntity<List<NotificationHistoryDto>> getNotificationsByType(
            @PathVariable NotificationType notificationType) {

        log.info("REST: Getting notifications by type: {}", notificationType);

        try {
            List<NotificationHistoryDto> notifications = notificationService
                .getNotificationsByType(notificationType);

            return ResponseEntity.ok(notifications);

        } catch (Exception e) {
            log.error("Error getting notifications by type: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Retry a failed notification
     * POST /api/notifications/{notificationLogId}/retry
     */
    @PostMapping("/{notificationLogId}/retry")
    public ResponseEntity<NotificationResponse> retryNotification(
            @PathVariable Long notificationLogId) {

        log.info("REST: Retrying notification: {}", notificationLogId);

        try {
            NotificationResponse response = notificationService
                .retryNotification(notificationLogId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error retrying notification: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(NotificationResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    /**
     * Update notification status (webhook endpoint)
     * PUT /api/notifications/{notificationLogId}/status
     */
    @PutMapping("/{notificationLogId}/status")
    public ResponseEntity<Void> updateNotificationStatus(
            @PathVariable Long notificationLogId,
            @RequestParam String channel,
            @RequestParam String status,
            @RequestParam(required = false) String timestamp) {

        log.info("REST: Updating notification status - logId: {}, channel: {}, status: {}",
            notificationLogId, channel, status);

        try {
            notificationService.updateNotificationStatus(
                notificationLogId, channel, status, timestamp);

            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("Error updating notification status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get delivery statistics
     * GET /api/notifications/statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getDeliveryStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        log.info("REST: Getting delivery statistics from {} to {}", startDate, endDate);

        try {
            Map<String, Object> statistics = notificationService
                .getDeliveryStatistics(startDate, endDate);

            return ResponseEntity.ok(statistics);

        } catch (Exception e) {
            log.error("Error getting delivery statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Health check endpoint
     * GET /api/notifications/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "NotificationService",
            "timestamp", LocalDateTime.now().toString()
        ));
    }
}
