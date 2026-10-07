package com.fleetmanagement.kitchencrmbackend.modules.permission.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Everything the Permissions page needs: who, what, and the current answers. */
@Getter
@Setter
@NoArgsConstructor
public class PermissionMatrixDto {

    private List<StaffTypeDto> staffTypes = new ArrayList<>();
    private List<ModuleDto> modules = new ArrayList<>();
    /** staff type -> permission key -> allowed. */
    private Map<String, Map<String, Boolean>> values = new LinkedHashMap<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StaffTypeDto {
        private String key;
        private String label;
        /** Active staff of this type right now. */
        private Integer users;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModuleDto {
        private String name;
        private List<PermissionDto> permissions;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionDto {
        private String key;
        private String label;
        private String description;
        private Boolean defaultAllowed;
        /** Only hides something on the screen; the server cannot enforce it. */
        private Boolean screenOnly;
    }
}
