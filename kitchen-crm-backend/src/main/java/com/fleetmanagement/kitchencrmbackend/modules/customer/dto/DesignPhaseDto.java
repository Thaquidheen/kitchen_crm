package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DesignPhaseDto {

    private Long id;

    @NotNull(message = "Customer ID is required")
    private Long customerId;
    private String customerName;

    private Long quotationId;
    private String quotationNumber;

    private String plan;
    private String design;
    private String designRequirements;

    private Boolean submittedToClient;
    private LocalDateTime submissionDate;

    private String clientFeedback;
    private LocalDateTime feedbackDate;

    private LocalDateTime meetingScheduled;
    private Boolean meetingCompleted;
    private String meetingNotes;

    private Boolean designAmountFrozen;
    private BigDecimal frozenAmount;

    private Boolean clientGroupCreated;
    private String whatsappGroupLink;

    private DesignPhase.DesignStatus designStatus;
    private String designerAssigned;
    private Integer designCompletionPercentage;
    private Integer revisionCount;
    private LocalDateTime clientApprovalDate;
    private String designFilesPath;

    // Calculated fields
    private Integer overallProgress;
    private Boolean canFreezeDesign;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}