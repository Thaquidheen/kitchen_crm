package com.fleetmanagement.kitchencrmbackend.modules.architect.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ArchitectVisitDto {
    private Long id;
    private Long architectId;
    private LocalDateTime visitDate;
    private String notes;
    private String visitedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}







