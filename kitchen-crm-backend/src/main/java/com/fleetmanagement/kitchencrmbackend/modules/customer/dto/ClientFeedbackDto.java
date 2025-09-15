package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClientFeedbackDto {

    @NotBlank(message = "Client feedback is required")
    private String clientFeedback;

    private Boolean requiresRevision;
    private String revisionNotes;
}