package com.fleetmanagement.kitchencrmbackend.modules.architect.dto;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ArchitectUpdateDto {
    private String architectureName;
    private Architect.PartnerType partnerType;
    private String firm;
    private String contactNumber;
    private String principalArchitectName;
}




