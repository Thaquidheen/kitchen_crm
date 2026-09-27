package com.fleetmanagement.kitchencrmbackend.modules.measurement.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class SiteMeasurementDto {
    private Long customerId;
    /** Null until the first save. */
    private Map<String, Object> layout;
    private String notes;
    private List<SiteMeasurementValueDto> values = new ArrayList<>();
    private String updatedBy;
    /** ISO-8601 with the business-timezone offset. */
    private String updatedAt;
}
