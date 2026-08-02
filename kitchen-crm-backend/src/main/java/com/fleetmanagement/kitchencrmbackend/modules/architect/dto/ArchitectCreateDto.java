package com.fleetmanagement.kitchencrmbackend.modules.architect.dto;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ArchitectCreateDto {

    @NotBlank(message = "Architecture name is required")
    private String architectureName;

    /** Defaults to ARCHITECT when omitted, so existing clients keep working unchanged. */
    private Architect.PartnerType partnerType;

    private String firm;

    private String contactNumber;

    private String principalArchitectName;
}




