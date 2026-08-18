package com.fleetmanagement.kitchencrmbackend.modules.audit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** One user's sign-in footprint: last login, how often, and from which addresses. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginSummaryDto {
    private String email;
    private String name;
    private LocalDateTime lastLogin;
    private Long loginCount;
    private Long distinctIpCount;
    /** Most recent first, capped server-side. */
    private List<String> recentIps = new ArrayList<>();
}
