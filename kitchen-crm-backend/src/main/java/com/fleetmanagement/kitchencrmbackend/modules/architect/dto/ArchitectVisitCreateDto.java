package com.fleetmanagement.kitchencrmbackend.modules.architect.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ArchitectVisitCreateDto {

    @NotNull(message = "Architect ID is required")
    private Long architectId;

    @NotNull(message = "Visit date is required")
    private LocalDateTime visitDate;

    private String notes;

    private String visitedBy;
}







