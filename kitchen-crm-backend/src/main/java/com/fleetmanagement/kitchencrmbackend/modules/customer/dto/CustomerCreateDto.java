package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCreateDto {
    @NotBlank(message = "Customer name is required")
    private String name;

    private String contact;

    @Email(message = "Email should be valid")
    private String email;

    private String address;
    private String kitchenTypes;
}