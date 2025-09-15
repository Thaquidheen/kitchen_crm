package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionInstallation;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductionInstallationDto {

    private Long id;

    @NotNull(message = "Customer ID is required")
    private Long customerId;
    private String customerName;

    // Production Phase
    private Boolean epdReceived;
    private LocalDate epdReceivedDate;
    private Boolean productionStarted;
    private LocalDate productionStartDate;
    private LocalDate estimatedProductionCompletion;
    private LocalDate actualProductionCompletion;

    // Site Preparation
    private Boolean siteVisitMarking;
    private LocalDate siteVisitDate;
    private Boolean siteMeasurementsVerified;
    private Boolean flooringCompleted;
    private LocalDate flooringCompletionDate;
    private Boolean ceilingCompleted;
    private LocalDate ceilingCompletionDate;
    private Boolean electricalWorkCompleted;
    private Boolean plumbingWorkCompleted;

    // Delivery Tracking
    private Boolean carcassAtSite;
    private LocalDate carcassDeliveryDate;
    private Boolean countertopAtSite;
    private LocalDate countertopDeliveryDate;
    private Boolean shuttersAtSite;
    private LocalDate shuttersDeliveryDate;
    private Boolean accessoriesAtSite;
    private LocalDate accessoriesDeliveryDate;

    // Installation Phase
    private Boolean carcassInstalled;
    private LocalDate carcassInstallationDate;
    private Boolean countertopInstalled;
    private LocalDate countertopInstallationDate;
    private Boolean shuttersInstalled;
    private LocalDate shuttersInstallationDate;
    private Boolean accessoriesInstalled;
    private LocalDate accessoriesInstallationDate;

    // Appliances & Final Setup
    private Boolean appliancesReceived;
    private LocalDate appliancesReceivedDate;
    private Boolean appliancesInstalled;
    private LocalDate appliancesInstallationDate;
    private Boolean lightsInstalled;
    private LocalDate lightsInstallationDate;
    private Boolean finalCleaningDone;
    private LocalDate finalCleaningDate;

    // Project Completion
    private Boolean handoverToClient;
    private LocalDate handoverDate;
    private String clientFeedbackPhotography;
    private Boolean warrantyProvided;
    private String warrantyDocumentPath;

    // Project Status and Team
    private ProductionInstallation.InstallationStatus overallStatus;
    private String projectManagerAssigned;
    private String installationTeamLead;
    private LocalDate estimatedCompletionDate;
    private LocalDate actualCompletionDate;
    private String installationNotes;

    // Quality Control
    private Boolean qualityCheckPassed;
    private LocalDate qualityCheckDate;
    private String qualityCheckNotes;

    // Calculated Fields
    private Integer overallProgressPercentage;
    private String currentPhase;
    private Boolean readyForInstallation;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}