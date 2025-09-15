package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationDto {
    private Long id;

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private String customerName;
    private String quotationNumber;
    private String projectName;

    @Positive(message = "Transportation price must be positive")
    private BigDecimal transportationPrice = BigDecimal.ZERO;

    @Positive(message = "Installation price must be positive")
    private BigDecimal installationPrice = BigDecimal.ZERO;

    private BigDecimal marginPercentage = BigDecimal.ZERO;
    private BigDecimal taxPercentage = BigDecimal.ZERO;
    private BigDecimal subtotal = BigDecimal.ZERO;
    private BigDecimal marginAmount = BigDecimal.ZERO;
    private BigDecimal taxAmount = BigDecimal.ZERO;
    private BigDecimal totalAmount = BigDecimal.ZERO;

    private Quotation.QuotationStatus status;
    private LocalDate validUntil;
    private String notes;
    private String termsConditions;
    private String createdBy;
    private String approvedBy;
    private LocalDate approvedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ACCESSORIES CATEGORY TOTALS
    private BigDecimal accessoriesBaseTotal = BigDecimal.ZERO;
    private BigDecimal accessoriesMarginAmount = BigDecimal.ZERO;
    private BigDecimal accessoriesTaxAmount = BigDecimal.ZERO;
    private BigDecimal accessoriesFinalTotal = BigDecimal.ZERO;

    // CABINETS CATEGORY TOTALS
    private BigDecimal cabinetsBaseTotal = BigDecimal.ZERO;
    private BigDecimal cabinetsMarginAmount = BigDecimal.ZERO;
    private BigDecimal cabinetsTaxAmount = BigDecimal.ZERO;
    private BigDecimal cabinetsFinalTotal = BigDecimal.ZERO;

    // DOORS CATEGORY TOTALS
    private BigDecimal doorsBaseTotal = BigDecimal.ZERO;
    private BigDecimal doorsMarginAmount = BigDecimal.ZERO;
    private BigDecimal doorsTaxAmount = BigDecimal.ZERO;
    private BigDecimal doorsFinalTotal = BigDecimal.ZERO;

    // LIGHTING CATEGORY TOTALS
    private BigDecimal lightingBaseTotal = BigDecimal.ZERO;
    private BigDecimal lightingMarginAmount = BigDecimal.ZERO;
    private BigDecimal lightingTaxAmount = BigDecimal.ZERO;
    private BigDecimal lightingFinalTotal = BigDecimal.ZERO;

    // Line items
    private List<QuotationAccessoryDto> accessories;
    private List<QuotationCabinetDto> cabinets;
    private List<QuotationDoorDto> doors;
    private List<QuotationLightingDto> lighting;
}






