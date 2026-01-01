package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationKitchenPlanImageDto {
    private Long id;
    private Long kitchenId;
    private Long customerPlanImageId;
    private Long designPhaseFileId;
    private String imageName;
    private String imageUrl;
    private Integer imageOrder;
}


