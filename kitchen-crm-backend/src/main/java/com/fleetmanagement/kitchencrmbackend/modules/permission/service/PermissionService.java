package com.fleetmanagement.kitchencrmbackend.modules.permission.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.permission.Permission;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.MyPermissionsDto;
import com.fleetmanagement.kitchencrmbackend.modules.permission.dto.PermissionMatrixDto;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;

import java.util.Map;

/**
 * Permissions per staff type, as the administrator set them. A super admin always has every
 * permission; everybody else gets what their staff type allows.
 */
public interface PermissionService {

    /** The one question every guarded action asks. */
    boolean can(UserPrincipal user, Permission permission);

    MyPermissionsDto mine(UserPrincipal user);

    PermissionMatrixDto matrix();

    /** Changes only what is sent: staff type -> permission key -> allowed. */
    ApiResponse<PermissionMatrixDto> save(Map<String, Map<String, Boolean>> values, UserPrincipal by);
}
