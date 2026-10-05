package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Someone quotation work can be given to, with what they already have. */
@Getter
@Setter
@NoArgsConstructor
public class QuotationAssigneeDto {
    private Long id;
    private String name;
    /** SALES | DESIGNER | ADMIN_STAFF | null, or ADMIN for a super admin. */
    private String staffType;
    private Integer openCount;
    private Integer overdue;
}
