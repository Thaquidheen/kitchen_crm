package com.fleetmanagement.kitchencrmbackend.modules.architect.dto;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ArchitectDto {
    private Long id;
    private String architectureName;
    private Architect.PartnerType partnerType;
    private String firm;
    private String contactNumber;
    private String principalArchitectName;
    private LocalDateTime lastVisitDate;
    private Long visitCount;
    private Boolean hasVisits;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}




