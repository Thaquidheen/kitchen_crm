package com.fleetmanagement.kitchencrmbackend.modules.vendor.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VendorUpdateDto {
    private String vendorName;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String vendorType;
    private Boolean active;
    private String notes;
}
