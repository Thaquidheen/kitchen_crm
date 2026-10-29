package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** A quotation as the work board names it. Deliberately carries no amounts. */
@Getter
@Setter
@NoArgsConstructor
public class QuotationRefDto {
    private Long id;
    private String quotationNumber;
    private String projectName;
    private Integer versionNumber;
    private String status;
    private LocalDateTime createdAt;
    /** The folder holding its versions: a version saved from it ("Save as New") shares it. */
    private Long folderId;
}
