package com.fleetmanagement.kitchencrmbackend.modules.design.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DesignReviewRequest {
    /** APPROVE or CHANGES */
    @NotBlank(message = "Decision is required")
    private String decision;
    @Size(max = 2000, message = "Notes are limited to 2000 characters")
    private String note;
}
