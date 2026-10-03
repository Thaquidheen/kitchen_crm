package com.fleetmanagement.kitchencrmbackend.modules.design.dto;

import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DesignJobUpdateRequest {
    /** Reassign to another designer (must be Designer type). */
    private Long designerId;
    private LocalDate dueDate;
    /** true removes the due date. */
    private Boolean clearDueDate;
    private String priority;
    private String brief;
    /** Any existing DesignStatus name, e.g. CANCELLED or IN_PROGRESS. */
    private String status;
}
