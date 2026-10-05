package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class QuotationWorkMeDto {
    private Long userId;
    /** Admin or Admin staff: sees the whole board, assigns, sets priority and order. */
    private Boolean canManage;
    /** Quotations waiting on this person. */
    private Integer openCount;
}
