package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "design_phase")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DesignPhase extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id")
    private Quotation quotation;

    @Column(name = "plan", columnDefinition = "TEXT")
    private String plan;

    @Column(name = "design", columnDefinition = "TEXT")
    private String design;

    @Column(name = "design_requirements", columnDefinition = "TEXT")
    private String designRequirements;

    @Column(name = "submitted_to_client")
    private Boolean submittedToClient = false;

    @Column(name = "submission_date")
    private LocalDateTime submissionDate;

    @Column(name = "client_feedback", columnDefinition = "TEXT")
    private String clientFeedback;

    @Column(name = "feedback_date")
    private LocalDateTime feedbackDate;

    @Column(name = "meeting_scheduled")
    private LocalDateTime meetingScheduled;

    @Column(name = "meeting_completed")
    private Boolean meetingCompleted = false;

    @Column(name = "meeting_notes", columnDefinition = "TEXT")
    private String meetingNotes;

    @Column(name = "design_amount_frozen")
    private Boolean designAmountFrozen = false;

    @Column(name = "frozen_amount", precision = 12, scale = 2)
    private BigDecimal frozenAmount;

    @Column(name = "client_group_created")
    private Boolean clientGroupCreated = false;

    @Column(name = "whatsapp_group_link")
    private String whatsappGroupLink;

    @Enumerated(EnumType.STRING)
    @Column(name = "design_status")
    private DesignStatus designStatus = DesignStatus.PLANNING;

    @Column(name = "designer_assigned")
    private String designerAssigned;

    @Column(name = "design_completion_percentage")
    private Integer designCompletionPercentage = 0;

    @Column(name = "revision_count")
    private Integer revisionCount = 0;

    @Column(name = "client_approval_date")
    private LocalDateTime clientApprovalDate;

    @Column(name = "design_files_path")
    private String designFilesPath;

    public enum DesignStatus {
        PLANNING,           // Initial planning phase
        IN_PROGRESS,        // Design work in progress
        SUBMITTED,          // Submitted to client for review
        FEEDBACK_RECEIVED,  // Client feedback received
        REVISION_REQUIRED,  // Revisions needed
        APPROVED,           // Client approved design
        FROZEN,             // Design frozen, ready for production
        CANCELLED           // Design cancelled
    }

    // Helper method to check if design can be frozen
    @Transient
    public boolean canFreezeDesign() {
        return designStatus == DesignStatus.APPROVED &&
                clientApprovalDate != null &&
                !designAmountFrozen;
    }

    // Helper method to calculate overall progress
    @Transient
    public Integer getOverallProgress() {
        int progress = 0;

        if (plan != null && !plan.trim().isEmpty()) progress += 15;
        if (design != null && !design.trim().isEmpty()) progress += 20;
        if (submittedToClient != null && submittedToClient) progress += 20;
        if (clientFeedback != null && !clientFeedback.trim().isEmpty()) progress += 15;
        if (designStatus == DesignStatus.APPROVED) progress += 20;
        if (designAmountFrozen != null && designAmountFrozen) progress += 10;

        return Math.min(progress, 100);
    }
}