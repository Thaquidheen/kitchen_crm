package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationKitchenCreateDto {
    private String kitchenName;
    private Integer kitchenOrder;
    private BigDecimal transportationPrice = BigDecimal.ZERO;
    private BigDecimal installationPrice = BigDecimal.ZERO;
    
    // Scope details
    private List<QuotationKitchenScopeDetailCreateDto> scopeDetails;

    // Plan images (references to customer files)
    private List<QuotationKitchenPlanImageCreateDto> planImages;

    // Elevations
    private List<QuotationElevationCreateDto> elevations;
    
    // Products for this kitchen
    private List<QuotationAccessoryDto> accessories;
    private List<QuotationCabinetDto> cabinets;
    private List<QuotationDoorDto> doors;
    private List<QuotationLightingDto> lighting;
}

