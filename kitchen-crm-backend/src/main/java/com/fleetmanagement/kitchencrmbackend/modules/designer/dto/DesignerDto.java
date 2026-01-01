package com.fleetmanagement.kitchencrmbackend.modules.designer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DesignerDto {
    
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private String department;
    private String specialization;
    private Integer experienceYears;
    private Double hourlyRate;
    private Boolean active;
    private String bio;
    private String skills;
    private String portfolioUrl;
    private Integer maxConcurrentProjects;
    private Integer averageCompletionDays;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Computed fields
    private Integer currentProjects;
    private Integer completedProjects;
    private Double averageRating;
    private Boolean available;
}
