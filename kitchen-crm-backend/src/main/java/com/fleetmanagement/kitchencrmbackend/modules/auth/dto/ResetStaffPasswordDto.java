package com.fleetmanagement.kitchencrmbackend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A super-admin setting a staff member's password directly. The rules are deliberately identical
 * to UserCreateDto / ChangePasswordRequest so an account can never be given a password weaker
 * than the one its owner would be allowed to choose.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResetStaffPasswordDto {

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 50, message = "Password must be between 8 and 50 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    private String newPassword;
}
