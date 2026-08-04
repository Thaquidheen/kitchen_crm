package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A free-text note pinned to a customer's activity feed. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerNoteRequest {

    @NotBlank(message = "Note cannot be empty")
    @Size(max = 2000, message = "Note cannot be longer than 2000 characters")
    private String note;
}
