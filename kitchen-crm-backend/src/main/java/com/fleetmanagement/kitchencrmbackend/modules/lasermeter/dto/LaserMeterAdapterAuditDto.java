package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class LaserMeterAdapterAuditDto {
    private Long id;
    private Long adapterId;
    private String adapterKey;
    private String action;
    private Map<String, Object> beforeConfig;
    private Map<String, Object> afterConfig;
    private String actorEmail;
    private String actorName;
    private String createdAt;
}
