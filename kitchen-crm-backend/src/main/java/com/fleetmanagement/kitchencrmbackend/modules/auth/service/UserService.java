package com.fleetmanagement.kitchencrmbackend.modules.auth.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.UserCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.UserDto;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.UserUpdateDto;

import java.util.List;

public interface UserService {

    /**
     * Get all staff users
     */
    ApiResponse<List<UserDto>> getAllStaff();

    /**
     * Get staff user by ID
     */
    ApiResponse<UserDto> getStaffById(Long id);

    /**
     * Create new staff user
     * Sends login credentials email to the new staff member
     */
    ApiResponse<UserDto> createStaff(UserCreateDto userCreateDto);

    /**
     * Update existing staff user
     */
    ApiResponse<UserDto> updateStaff(Long id, UserUpdateDto userUpdateDto);

    /**
     * Delete/deactivate staff user
     */
    ApiResponse<String> deleteStaff(Long id);

    /** Super-admin sets a staff member's password directly (e.g. the member forgot theirs). */
    ApiResponse<String> resetStaffPassword(Long id, String newPassword);

    /**
     * Permanently removes a staff record. Refuses when the member still owns work records
     * (tasks, design phases, production tasks) rather than destroying that history.
     */
    ApiResponse<String> deleteStaffPermanently(Long id);
}







