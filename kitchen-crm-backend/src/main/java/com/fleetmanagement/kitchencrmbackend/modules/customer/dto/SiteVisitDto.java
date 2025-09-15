package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SiteVisitDto {

    @NotNull(message = "Visit date is required")
    private LocalDate visitDate;

    private Boolean measurementsVerified;
    private String visitNotes;
    private String visitedBy;
}