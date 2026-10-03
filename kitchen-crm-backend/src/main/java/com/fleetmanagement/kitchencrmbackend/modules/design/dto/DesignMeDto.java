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
}
