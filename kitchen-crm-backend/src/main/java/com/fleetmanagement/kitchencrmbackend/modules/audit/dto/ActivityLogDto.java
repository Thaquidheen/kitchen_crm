package com.fleetmanagement.kitchencrmbackend.modules.audit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogDto {
    private Long id;
    private String eventType;
    private String actorEmail;
    private String actorName;
    private String actorRole;
    private String module;
    private String httpMethod;
    private String summary;
    private Integer statusCode;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;
}
