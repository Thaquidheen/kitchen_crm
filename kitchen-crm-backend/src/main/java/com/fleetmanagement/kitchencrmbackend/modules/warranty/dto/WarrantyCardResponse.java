package com.fleetmanagement.kitchencrmbackend.modules.warranty.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyCardResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private Long projectId;
    private String projectName;
    private String certificateNumber;
    private LocalDate issueDate;
    private LocalDate projectCompletionDate;
    private String projectAddress;
    private String projectDescription;
    private String authorizedName;
    private String authorizedDesignation;
    private LocalDate signatureDate;
    private String pdfFilePath;
    private Boolean emailSent;
    private LocalDateTime emailSentAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


