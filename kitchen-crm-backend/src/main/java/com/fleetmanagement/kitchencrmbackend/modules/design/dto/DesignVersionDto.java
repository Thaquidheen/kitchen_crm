package com.fleetmanagement.kitchencrmbackend.modules.design.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignPhaseFileDto;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One version of a customer's design, with the design files that belong to it. */
@Getter
@Setter
@NoArgsConstructor
public class DesignVersionDto {
    private Integer versionNo;
    /** DESIGNER or UPLOADED. */
    private String origin;
    private String designerName;
    /** The brief for version 1; what had to change for later versions. */
    private String requestNote;
    private String requestedByName;
    private LocalDateTime requestedAt;
    private LocalDateTime completedAt;
    /** Null while the version is open (or was cancelled). */
    private LocalDateTime approvedAt;
    private String approvedByName;
    private List<DesignPhaseFileDto> files;
}
