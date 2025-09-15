package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationCreateDto {
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private String projectName;
    private BigDecimal transportationPrice = BigDecimal.ZERO;
    private BigDecimal installationPrice = BigDecimal.ZERO;
    private BigDecimal marginPercentage = BigDecimal.ZERO;
    private BigDecimal taxPercentage = BigDecimal.ZERO;
    private LocalDate validUntil;
    private String notes;
    private String termsConditions;

    // Line items
    private List<QuotationAccessoryDto> accessories;
    private List<QuotationCabinetDto> cabinets;
    private List<QuotationDoorDto> doors;
    private List<QuotationLightingDto> lighting;
}