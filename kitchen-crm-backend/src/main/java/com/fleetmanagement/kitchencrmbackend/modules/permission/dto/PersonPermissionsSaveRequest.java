package com.fleetmanagement.kitchencrmbackend.modules.permission.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class PersonPermissionsSaveRequest {
    /**
     * permission key -> true | false for this person, or null to follow their staff type again.
     * Only what is sent is changed.
     */
    private Map<String, Boolean> values = new LinkedHashMap<>();
}
