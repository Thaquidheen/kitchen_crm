package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class DeviceLabLogRequest {

    @NotBlank
    @Size(max = 200)
    private String title;

    @Size(max = 200)
    private String deviceName;

    @Size(max = 64)
    private String adapterKey;

    @Size(max = 5000)
    private String notes;

    /** The exported session JSON (device, services, entries, marks). */
    @NotNull
    private Map<String, Object> log;
}
