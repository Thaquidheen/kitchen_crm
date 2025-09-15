package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DesignPhaseCreateDto {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private Long quotationId;
    private String designRequirements;
    private String designerAssigned;
}