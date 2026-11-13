package com.fleetmanagement.kitchencrmbackend.modules.permission.dto;

import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.PermissionMatrixDto.ModuleDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** One person's permissions: what their staff type gives, what is set for them, and the outcome. */
@Getter
@Setter
@NoArgsConstructor
public class PersonPermissions {
    private Long userId;
    private String name;
    /** ADMIN_STAFF | DESIGNER | SALES | NONE */
    private String staffType;
    private String staffTypeLabel;
    private Boolean active;
    /** The same catalogue the staff type table shows. */
    private List<ModuleDto> modules = new ArrayList<>();
    /** permission key -> the staff type's switch; false where the permission does not apply to the type. */
    private Map<String, Boolean> typeValues = new LinkedHashMap<>();
    /** permission key -> what is set for this person; only keys set for them that still apply. */
    private Map<String, Boolean> overrides = new LinkedHashMap<>();
    /** permission key -> what the person really has, required permissions included. */
    private Map<String, Boolean> effective = new LinkedHashMap<>();
}
