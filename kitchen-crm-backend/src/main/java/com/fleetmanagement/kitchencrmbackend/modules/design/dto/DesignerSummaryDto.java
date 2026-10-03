package com.fleetmanagement.kitchencrmbackend.modules.design.dto;


import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DesignerSummaryDto {
    private Long id;
    private String name;
    /** Admin-set: AVAILABLE | BUSY | ON_LEAVE, or null. */
    private String designerStatus;
    private Integer waiting;
    private Integer inProgress;
    private Integer changesRequested;
    private Integer awaitingReview;
    private Integer overdue;
    /** waiting + inProgress + changesRequested. */
    private Integer activeCount;
    private Long currentJobId;
    private String currentCustomerName;
}
