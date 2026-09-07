package com.fleetmanagement.kitchencrmbackend.modules.architect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ArchitectNoteRequest {
    @NotBlank(message = "Note cannot be empty")
    @Size(max = 2000, message = "Note is too long")
    private String note;
}
