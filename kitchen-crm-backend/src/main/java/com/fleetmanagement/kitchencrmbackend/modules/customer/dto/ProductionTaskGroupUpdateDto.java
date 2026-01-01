package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductionTaskGroupUpdateDto {

    private String groupTitle;
    private String groupDescription;
    private Integer sortOrder;
    private Boolean isExpanded;
}
