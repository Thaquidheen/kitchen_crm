package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class DeviceLabLogDto {
    private Long id;
    private String title;
    private String deviceName;
    private String adapterKey;
    private String notes;
    private Integer entryCount;
    /** Omitted from list responses; present when fetching one log. */
    private Map<String, Object> log;
    private String createdBy;
    private String createdAt;
}
