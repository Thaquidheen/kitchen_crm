package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/** Every field is optional: only what is sent is changed. */
@Getter
@Setter
@NoArgsConstructor
public class QuotationJobUpdateRequest {
    private Long assigneeId;
    private LocalDate dueDate;
    private Boolean clearDueDate;
    /** LOW | MEDIUM | HIGH | URGENT */
    private String priority;
    private String note;
}
