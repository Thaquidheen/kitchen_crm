package com.fleetmanagement.kitchencrmbackend.modules.vendor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VendorCreateDto {

    @NotBlank(message = "Vendor name is required")
    private String vendorName;

    private String contactPerson;

    private String phone;

    private String email;

    private String address;

    @NotNull(message = "Vendor type is required")
    private String vendorType;

    private Boolean active = true;

    private String notes;
}
