package com.fleetmanagement.kitchencrmbackend.modules.design.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Send an approved design back for another version. */
@Getter
@Setter
@NoArgsConstructor
public class DesignRedesignRequest {
    @NotNull(message = "Choose a designer")
    private Long designerId;
    @NotBlank(message = "Say what needs to change")
    @Size(max = 2000, message = "Notes are limited to 2000 characters")
    private String note;
    private LocalDate dueDate;
    /** LOW | MEDIUM | HIGH | URGENT */
    private String priority;
}
