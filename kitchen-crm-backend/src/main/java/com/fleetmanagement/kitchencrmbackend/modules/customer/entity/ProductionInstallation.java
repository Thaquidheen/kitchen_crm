package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "production_installation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductionInstallation extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    // Production Phase
    @Column(name = "epd_received")
    private Boolean epdReceived = false;

    @Column(name = "epd_received_date")
    private LocalDate epdReceivedDate;

    @Column(name = "production_started")
    private Boolean productionStarted = false;

    @Column(name = "production_start_date")
    private LocalDate productionStartDate;

    @Column(name = "estimated_production_completion")
    private LocalDate estimatedProductionCompletion;

    @Column(name = "actual_production_completion")
    private LocalDate actualProductionCompletion;

    // Site Preparation
    @Column(name = "site_visit_marking")
    private Boolean siteVisitMarking = false;

    @Column(name = "site_visit_date")
    private LocalDate siteVisitDate;

    @Column(name = "site_measurements_verified")
    private Boolean siteMeasurementsVerified = false;

    @Column(name = "flooring_completed")
    private Boolean flooringCompleted = false;

    @Column(name = "flooring_completion_date")
    private LocalDate flooringCompletionDate;

    @Column(name = "ceiling_completed")
    private Boolean ceilingCompleted = false;

    @Column(name = "ceiling_completion_date")
    private LocalDate ceilingCompletionDate;

    @Column(name = "electrical_work_completed")
    private Boolean electricalWorkCompleted = false;

    @Column(name = "plumbing_work_completed")
    private Boolean plumbingWorkCompleted = false;

    // Delivery Tracking
    @Column(name = "carcass_at_site")
    private Boolean carcassAtSite = false;

    @Column(name = "carcass_delivery_date")
    private LocalDate carcassDeliveryDate;

    @Column(name = "countertop_at_site")
    private Boolean countertopAtSite = false;

    @Column(name = "countertop_delivery_date")
    private LocalDate countertopDeliveryDate;

    @Column(name = "shutters_at_site")
    private Boolean shuttersAtSite = false;

    @Column(name = "shutters_delivery_date")
    private LocalDate shuttersDeliveryDate;

    @Column(name = "accessories_at_site")
    private Boolean accessoriesAtSite = false;

    @Column(name = "accessories_delivery_date")
    private LocalDate accessoriesDeliveryDate;

    // Installation Phase
    @Column(name = "carcass_installed")
    private Boolean carcassInstalled = false;

    @Column(name = "carcass_installation_date")
    private LocalDate carcassInstallationDate;

    @Column(name = "countertop_installed")
    private Boolean countertopInstalled = false;

    @Column(name = "countertop_installation_date")
    private LocalDate countertopInstallationDate;

    @Column(name = "shutters_installed")
    private Boolean shuttersInstalled = false;

    @Column(name = "shutters_installation_date")
    private LocalDate shuttersInstallationDate;

    @Column(name = "accessories_installed")
    private Boolean accessoriesInstalled = false;

    @Column(name = "accessories_installation_date")
    private LocalDate accessoriesInstallationDate;

    // Appliances & Final Setup
    @Column(name = "appliances_received")
    private Boolean appliancesReceived = false;

    @Column(name = "appliances_received_date")
    private LocalDate appliancesReceivedDate;

    @Column(name = "appliances_installed")
    private Boolean appliancesInstalled = false;

    @Column(name = "appliances_installation_date")
    private LocalDate appliancesInstallationDate;

    @Column(name = "lights_installed")
    private Boolean lightsInstalled = false;

    @Column(name = "lights_installation_date")
    private LocalDate lightsInstallationDate;

    @Column(name = "final_cleaning_done")
    private Boolean finalCleaningDone = false;

    @Column(name = "final_cleaning_date")
    private LocalDate finalCleaningDate;

    // Project Completion
    @Column(name = "handover_to_client")
    private Boolean handoverToClient = false;

    @Column(name = "handover_date")
    private LocalDate handoverDate;

    @Column(name = "client_feedback_photography", columnDefinition = "TEXT")
    private String clientFeedbackPhotography;

    @Column(name = "warranty_provided")
    private Boolean warrantyProvided = false;

    @Column(name = "warranty_document_path")
    private String warrantyDocumentPath;

    // Project Status and Team
    @Enumerated(EnumType.STRING)
    @Column(name = "overall_status")
    private InstallationStatus overallStatus = InstallationStatus.NOT_STARTED;

    @Column(name = "project_manager_assigned")
    private String projectManagerAssigned;

    @Column(name = "installation_team_lead")
    private String installationTeamLead;

    @Column(name = "estimated_completion_date")
    private LocalDate estimatedCompletionDate;

    @Column(name = "actual_completion_date")
    private LocalDate actualCompletionDate;

    @Column(name = "installation_notes", columnDefinition = "TEXT")
    private String installationNotes;

    @Column(name = "quality_check_passed")
    private Boolean qualityCheckPassed = false;

    @Column(name = "quality_check_date")
    private LocalDate qualityCheckDate;

    @Column(name = "quality_check_notes", columnDefinition = "TEXT")
    private String qualityCheckNotes;

    public enum InstallationStatus {
        NOT_STARTED,        // Initial state
        PRODUCTION,         // Manufacturing in progress
        SITE_PREPARATION,   // Site preparation phase
        DELIVERY,           // Materials being delivered
        INSTALLATION,       // Installation in progress
        QUALITY_CHECK,      // Quality inspection phase
        COMPLETED,          // Project completed
        ON_HOLD,           // Temporarily paused
        CANCELLED          // Project cancelled
    }

    // Helper method to calculate overall progress percentage
    @Transient
    public Integer getOverallProgressPercentage() {
        int totalTasks = 19; // Total number of boolean tasks
        int completedTasks = 0;

        if (Boolean.TRUE.equals(epdReceived)) completedTasks++;
        if (Boolean.TRUE.equals(productionStarted)) completedTasks++;
        if (Boolean.TRUE.equals(siteVisitMarking)) completedTasks++;
        if (Boolean.TRUE.equals(siteMeasurementsVerified)) completedTasks++;
        if (Boolean.TRUE.equals(flooringCompleted)) completedTasks++;
        if (Boolean.TRUE.equals(ceilingCompleted)) completedTasks++;
        if (Boolean.TRUE.equals(electricalWorkCompleted)) completedTasks++;
        if (Boolean.TRUE.equals(plumbingWorkCompleted)) completedTasks++;
        if (Boolean.TRUE.equals(carcassAtSite)) completedTasks++;
        if (Boolean.TRUE.equals(countertopAtSite)) completedTasks++;
        if (Boolean.TRUE.equals(shuttersAtSite)) completedTasks++;
        if (Boolean.TRUE.equals(carcassInstalled)) completedTasks++;
        if (Boolean.TRUE.equals(countertopInstalled)) completedTasks++;
        if (Boolean.TRUE.equals(shuttersInstalled)) completedTasks++;
        if (Boolean.TRUE.equals(appliancesInstalled)) completedTasks++;
        if (Boolean.TRUE.equals(lightsInstalled)) completedTasks++;
        if (Boolean.TRUE.equals(finalCleaningDone)) completedTasks++;
        if (Boolean.TRUE.equals(qualityCheckPassed)) completedTasks++;
        if (Boolean.TRUE.equals(handoverToClient)) completedTasks++;

        return (int) ((completedTasks * 100.0) / totalTasks);
    }

    // Helper method to get current phase
    @Transient
    public String getCurrentPhase() {
        if (Boolean.TRUE.equals(handoverToClient)) {
            return "COMPLETED";
        } else if (Boolean.TRUE.equals(qualityCheckPassed)) {
            return "HANDOVER_PENDING";
        } else if (Boolean.TRUE.equals(carcassInstalled) || Boolean.TRUE.equals(countertopInstalled) ||
                Boolean.TRUE.equals(shuttersInstalled)) {
            return "INSTALLATION";
        } else if (Boolean.TRUE.equals(carcassAtSite) || Boolean.TRUE.equals(countertopAtSite) ||
                Boolean.TRUE.equals(shuttersAtSite)) {
            return "DELIVERY";
        } else if (Boolean.TRUE.equals(siteVisitMarking) || Boolean.TRUE.equals(flooringCompleted)) {
            return "SITE_PREPARATION";
        } else if (Boolean.TRUE.equals(epdReceived) || Boolean.TRUE.equals(productionStarted)) {
            return "PRODUCTION";
        } else {
            return "NOT_STARTED";
        }
    }

    // Helper method to check if ready for next phase
    @Transient
    public boolean isReadyForInstallation() {
        return Boolean.TRUE.equals(siteVisitMarking) &&
                Boolean.TRUE.equals(flooringCompleted) &&
                Boolean.TRUE.equals(ceilingCompleted) &&
                Boolean.TRUE.equals(carcassAtSite) &&
                Boolean.TRUE.equals(countertopAtSite) &&
                Boolean.TRUE.equals(shuttersAtSite);
    }
}