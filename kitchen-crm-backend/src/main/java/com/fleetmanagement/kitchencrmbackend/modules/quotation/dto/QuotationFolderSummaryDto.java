package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
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
public class QuotationFolderSummaryDto {
    private Long id;
    private String name;
    private Long customerId;
    private String customerName;
    private Integer versionCount;
    // Latest (highest) version in the folder
    private Long latestQuotationId;
    private String latestQuotationNumber;
    private Integer latestVersionNumber;
    private BigDecimal latestTotalAmount;
    private Quotation.QuotationStatus latestStatus;
    private LocalDateTime latestCreatedAt;
}
