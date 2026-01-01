package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationKitchenPlanImageCreateDto {
    private Long customerPlanImageId; // Reference to CustomerPlanImage
    private Long designPhaseFileId; // Reference to DesignPhaseFile (PLAN category)
    private String imageName; // Copied for reference
    private String imageUrl; // Copied for reference
    private Integer imageOrder; // 1-4
}


