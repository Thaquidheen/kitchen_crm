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
public class HandoverDto {

    @NotNull(message = "Handover date is required")
    private LocalDate handoverDate;

    private String clientFeedbackPhotography;
    private Boolean warrantyProvided;
    private String warrantyDocumentPath;
    private String handoverNotes;
}