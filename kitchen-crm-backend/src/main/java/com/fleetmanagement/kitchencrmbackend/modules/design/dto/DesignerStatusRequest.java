package com.fleetmanagement.kitchencrmbackend.modules.design.dto;


import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DesignerStatusRequest {
    /** AVAILABLE | BUSY | ON_LEAVE, or blank to clear. */
    private String status;
}
