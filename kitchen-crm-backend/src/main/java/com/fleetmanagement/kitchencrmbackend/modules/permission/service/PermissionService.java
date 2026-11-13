package com.fleetmanagement.kitchencrmbackend.modules.permission.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.permission.Permission;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.MyPermissionsDto;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.PermissionMatrixDto;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.PersonPermissions;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.PersonSummary;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;

import java.util.List;
import java.util.Map;

/**
 * Permissions per staff type, as the administrator set them, and per person on top of that. A super
 * admin always has every permission; everybody else gets what their staff type allows, except where
 * the administrator set something different for them.
 */
public interface PermissionService {

    /** The one question every guarded action asks. */
    boolean can(UserPrincipal user, Permission permission);

    MyPermissionsDto mine(UserPrincipal user);

    PermissionMatrixDto matrix();

    /** Changes only what is sent: staff type -> permission key -> allowed. */
    ApiResponse<PermissionMatrixDto> save(Map<String, Map<String, Boolean>> values, UserPrincipal by);

    /** Every staff member (not the administrators), active ones first, then by name. */
    List<PersonSummary> people();

    ApiResponse<PersonPermissions> person(Long userId);

    /** Changes only what is sent: permission key -> allowed, or null to follow the staff type again. */
    ApiResponse<PersonPermissions> savePerson(Long userId, Map<String, Boolean> values, UserPrincipal by);

    /** Puts the person back on their staff type for everything. */
    ApiResponse<PersonPermissions> resetPerson(Long userId);
}
