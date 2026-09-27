package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

/** Create/update body. The config's own id/displayName/active are overwritten from these fields. */
@Getter
@Setter
@NoArgsConstructor
public class LaserMeterAdapterRequest {

    @NotBlank
    @Size(max = 64)
    private String adapterKey;

    @NotBlank
    @Size(max = 120)
    private String displayName;

    private Boolean active = true;

    @NotNull
    private Map<String, Object> config;
}
