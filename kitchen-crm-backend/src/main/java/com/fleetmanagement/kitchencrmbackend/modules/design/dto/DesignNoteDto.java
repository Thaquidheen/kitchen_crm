package com.fleetmanagement.kitchencrmbackend.modules.design.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DesignNoteDto {
    private Long id;
    private Long authorUserId;
    private String authorName;
    /** true = the designer wrote it, false = an admin. */
    private Boolean fromDesigner;
    private String message;
    private LocalDateTime createdAt;
    /** Design version the note was written under. */
    private Integer versionNo;
}
