package com.fleetmanagement.kitchencrmbackend.modules.design.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DesignAssignRequest {
    @NotNull(message = "Customer is required")
    private Long customerId;
    @NotNull(message = "Choose a designer")
    private Long designerId;
    private LocalDate dueDate;
    /** LOW | MEDIUM | HIGH | URGENT */
    private String priority;
    private String brief;
}
