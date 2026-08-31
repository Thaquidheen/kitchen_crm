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
    /**
     * Re-parent a group. Send a stage id to move it under that stage; send 0 to promote it back to
     * a top-level stage. Null leaves the parent untouched, matching every other field here.
     */
    private Long parentGroupId;
}
