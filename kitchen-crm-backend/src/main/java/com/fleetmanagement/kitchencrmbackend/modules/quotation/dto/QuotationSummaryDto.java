package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationSummaryDto {
    private Long id;
    private String quotationNumber;
    private String customerName;
    private String projectName;
    private BigDecimal totalAmount;
    private Quotation.QuotationStatus status;
    private LocalDate validUntil;
    private LocalDateTime createdAt;
    private String createdBy;
}