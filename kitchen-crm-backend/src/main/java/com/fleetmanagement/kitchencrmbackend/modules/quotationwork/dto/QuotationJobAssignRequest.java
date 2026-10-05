package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class QuotationJobAssignRequest {
    @NotNull(message = "Customer is required")
    private Long customerId;
    @NotNull(message = "Choose who prepares the quotation")
    private Long assigneeId;
    private LocalDate dueDate;
    /** LOW | MEDIUM | HIGH | URGENT */
    private String priority;
    private String note;
}
