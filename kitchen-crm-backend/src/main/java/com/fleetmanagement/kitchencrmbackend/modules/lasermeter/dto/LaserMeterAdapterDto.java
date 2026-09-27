package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class LaserMeterAdapterDto {
    private Long id;
    private String adapterKey;
    private String displayName;
    private Boolean active;
    /** The adapter JSON the browser runs on (id/displayName/active mirror the columns). */
    private Map<String, Object> config;
    private String createdBy;
    private String updatedBy;
    private String createdAt;
    private String updatedAt;
}
