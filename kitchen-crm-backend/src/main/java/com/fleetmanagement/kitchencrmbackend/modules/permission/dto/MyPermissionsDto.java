package com.fleetmanagement.kitchencrmbackend.modules.permission.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashMap;
import java.util.Map;

/** What the signed-in person may do; the screens hide what is not allowed. */
@Getter
@Setter
@NoArgsConstructor
public class MyPermissionsDto {
    private Boolean superAdmin;
    /** ADMIN_STAFF | DESIGNER | SALES | NONE; null for a super admin. */
    private String staffType;
    /** permission key -> allowed, for every permission in the catalogue. */
    private Map<String, Boolean> permissions = new LinkedHashMap<>();
}
