package com.fleetmanagement.kitchencrmbackend.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateDto {
    
    @Size(min = 2, max = 255, message = "Name must be between 2 and 255 characters")
    private String name;

    @Email(message = "Email must be valid")
    private String email;

    private String phoneNumber;

    private Boolean active;
}







