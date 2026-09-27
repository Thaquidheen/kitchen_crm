package com.fleetmanagement.kitchencrmbackend.modules.measurement.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Full replacement of a customer's site measurements (layout + every value). */
@Getter
@Setter
@NoArgsConstructor
public class SiteMeasurementSaveRequest {

    private Map<String, Object> layout;

    @Size(max = 5000)
    private String notes;

    @NotNull
    @Size(max = 1000, message = "Too many measurement values")
    @Valid
    private List<SiteMeasurementValueDto> values = new ArrayList<>();
}
