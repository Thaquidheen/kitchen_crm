package com.fleetmanagement.kitchencrmbackend.modules.measurement.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One measured field as the measuring screen sends and receives it. */
@Getter
@Setter
@NoArgsConstructor
public class SiteMeasurementValueDto {

    @NotBlank
    @Pattern(regexp = "^[A-Za-z0-9_.-]{1,120}$", message = "Invalid measurement key")
    private String key;

    @NotNull
    @Min(0)
    @Max(100000)
    private Integer valueMm;

    @NotNull
    @Pattern(regexp = "^(laser_ble|laser_hid|manual)$", message = "Source must be laser_ble, laser_hid or manual")
    private String source;

    @Size(max = 64)
    private String deviceAdapterId;

    /** Truncated to 500 characters by the service. */
    private String raw;

    /** ISO-8601 instant (with offset or Z). Defaults to now when missing. */
    private String capturedAt;

    private Boolean editedAfterCapture;
}
