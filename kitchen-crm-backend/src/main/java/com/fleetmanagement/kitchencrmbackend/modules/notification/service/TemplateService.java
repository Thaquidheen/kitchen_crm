package com.fleetmanagement.kitchencrmbackend.modules.notification.service;

import java.util.Map;

/**
 * Service for handling template variable replacement and formatting
 */
public interface TemplateService {

    /**
     * Replace variables in a template string
     * Variables are in format: {{variableName}}
     *
     * @param template the template string
     * @param variables map of variable names to values
     * @return template with variables replaced
     */
    String replaceVariables(String template, Map<String, String> variables);

    /**
     * Format currency in Indian Rupee format
     *
     * @param amount the amount to format
     * @return formatted currency string (e.g., "₹5,00,000")
     */
    String formatCurrency(Double amount);

    /**
     * Format date in Indian format (dd/MM/yyyy)
     *
     * @param date the date to format
     * @return formatted date string
     */
    String formatDate(java.time.LocalDate date);

    /**
     * Format date time in readable format
     *
     * @param dateTime the date time to format
     * @return formatted date time string
     */
    String formatDateTime(java.time.LocalDateTime dateTime);

    /**
     * Generate a signing URL for a document
     *
     * @param documentId the signed document ID
     * @param token the signing token
     * @return complete signing URL
     */
    String generateSigningUrl(Long documentId, String token);

    /**
     * Escape HTML special characters in a string
     *
     * @param text the text to escape
     * @return HTML-escaped text
     */
    String escapeHtml(String text);

    /**
     * Build common variables map for a quotation
     *
     * @param quotationId the quotation ID
     * @return map of variables
     */
    Map<String, String> buildQuotationVariables(Long quotationId);

    /**
     * Build common variables map for a customer
     *
     * @param customerId the customer ID
     * @return map of variables
     */
    Map<String, String> buildCustomerVariables(Long customerId);

    /**
     * Build variables for signature request
     *
     * @param documentId the signed document ID
     * @return map of variables
     */
    Map<String, String> buildSignatureRequestVariables(Long documentId);

    /**
     * Build variables for design approval
     *
     * @param designPhaseId the design phase ID
     * @return map of variables
     */
    Map<String, String> buildDesignApprovalVariables(Long designPhaseId);
}
