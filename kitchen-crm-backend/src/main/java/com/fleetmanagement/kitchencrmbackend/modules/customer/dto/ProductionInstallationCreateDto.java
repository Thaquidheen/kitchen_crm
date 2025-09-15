package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductionInstallationCreateDto {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private String projectManagerAssigned;
    private String installationTeamLead;
    private LocalDate estimatedCompletionDate;
    private String installationNotes;
}