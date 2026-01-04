package com.fleetmanagement.kitchencrmbackend.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private String type;
    private Long expiresIn;
    private Long refreshExpiresIn;
    private Long id;
    private String name;
    private String email;
    private Set<String> roles;

    // Legacy constructor for backward compatibility
    public LoginResponse(String token, Long id, String name, String email, Set<String> roles) {
        this.accessToken = token;
        this.type = "Bearer";
        this.id = id;
        this.name = name;
        this.email = email;
        this.roles = roles;
    }

    // Getter for backward compatibility (returns accessToken as "token")
    public String getToken() {
        return accessToken;
    }
}
