package com.fleetmanagement.kitchencrmbackend.modules.appliance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApplianceFollowUpRequest {
    /** When the call happened; defaults to now when omitted. Naive business-timezone wall-clock. */
    private LocalDateTime calledAt;

    @NotBlank(message = "Note cannot be empty")
    @Size(max = 2000, message = "Note is too long")
    private String note;
}
