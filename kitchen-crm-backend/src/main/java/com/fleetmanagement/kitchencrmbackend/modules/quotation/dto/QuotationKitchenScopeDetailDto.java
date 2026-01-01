package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationKitchenScopeDetailDto {
    private Long id;
    private Long kitchenId;
    private String fieldName;
    private String fieldValue;
    private Integer fieldOrder;
}


