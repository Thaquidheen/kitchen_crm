package com.fleetmanagement.kitchencrmbackend.modules.design.dto;


import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DesignMeDto {
    private Long userId;
    private String staffType;
    private String designerStatus;
    private Boolean designer;
    /** May assign a design to a designer and order the queues: admins only. */
    private Boolean canAssign;
    /**
     * Sees the Designs board and hands over plan documents: admins, and staff whose type is Admin
     * staff. Assigning, ordering, reviewing and redesigning stay with admins.
     */
    private Boolean canCoordinate;
}
