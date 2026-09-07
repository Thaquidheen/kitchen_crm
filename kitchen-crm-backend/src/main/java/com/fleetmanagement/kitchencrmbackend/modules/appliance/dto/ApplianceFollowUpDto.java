package com.fleetmanagement.kitchencrmbackend.modules.appliance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplianceFollowUpDto {
    private Long id;
    private Long applianceCustomerId;
    private LocalDateTime calledAt;
    private String note;
    private String createdBy;
    private LocalDateTime createdAt;
}
