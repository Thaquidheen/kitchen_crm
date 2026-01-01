package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhaseFile;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DesignFileUploadRequest {

    private Long designPhaseId;
    private Long customerId;
    private DesignPhaseFile.FileCategory fileCategory;
    private String description;
}
