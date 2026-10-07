package com.fleetmanagement.kitchencrmbackend.modules.permission.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class PermissionSaveRequest {
    /** staff type -> permission key -> allowed. Only what is sent is changed. */
    private Map<String, Map<String, Boolean>> values = new LinkedHashMap<>();
}
