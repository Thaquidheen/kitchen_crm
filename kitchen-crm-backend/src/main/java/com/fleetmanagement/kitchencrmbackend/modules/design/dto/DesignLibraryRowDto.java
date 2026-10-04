package com.fleetmanagement.kitchencrmbackend.modules.design.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A customer at Quotation Stage or later, with their design — or none, when it was never uploaded. */
@Getter
@Setter
@NoArgsConstructor
public class DesignLibraryRowDto {
    private Long customerId;
    private String customerName;
    private String customerPlace;
    /** CustomerStatus name. */
    private String customerStatus;
    /** Null = no design saved for this customer. */
    private DesignJobDto design;
}
