package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PipelineDto {
    private Long id;
    private Long customerId;
    private String siteMeasurements;
    private Boolean sitePhotosUploaded;
    private Boolean requirementsFulfilled;
}