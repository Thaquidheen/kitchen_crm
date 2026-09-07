package com.fleetmanagement.kitchencrmbackend.modules.architect.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArchitectNoteDto {
    private Long id;
    private Long architectId;
    private String note;
    private String createdBy;
    private LocalDateTime createdAt;
}
