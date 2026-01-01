package com.fleetmanagement.kitchencrmbackend.modules.designer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DesignerUpdateDto {
    
    private String name;
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
}
