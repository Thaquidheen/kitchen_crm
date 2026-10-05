package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class QuotationJobCompleteRequest {
    /** The quotation that is handed in; omitted = the customer's newest one. */
    private Long quotationId;
}
