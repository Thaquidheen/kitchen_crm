package com.fleetmanagement.kitchencrmbackend.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private Boolean active;
    private Set<String> roles;
    /** SALES | DESIGNER | ADMIN_STAFF, null when not set. */
    private String staffType;
    /** AVAILABLE | BUSY | ON_LEAVE (designers), null when not set. */
    private String designerStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}







