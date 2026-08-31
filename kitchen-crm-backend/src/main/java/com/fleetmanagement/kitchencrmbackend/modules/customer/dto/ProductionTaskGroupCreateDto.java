package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductionTaskGroupCreateDto {

    private Long customerId;
    private String groupTitle;
    private String groupDescription;
    private Integer sortOrder;
    /** Omit for a stage; set to the stage's id to create a sub-stage under it. */
    private Long parentGroupId;
}
