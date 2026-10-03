package com.fleetmanagement.kitchencrmbackend.modules.design.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DesignNoteRequest {
    @NotBlank(message = "Type a note first")
    @Size(max = 2000, message = "Notes are limited to 2000 characters")
    private String message;
}
