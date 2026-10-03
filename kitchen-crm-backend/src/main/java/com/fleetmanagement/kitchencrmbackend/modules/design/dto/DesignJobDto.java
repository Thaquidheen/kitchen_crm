package com.fleetmanagement.kitchencrmbackend.modules.design.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignPhaseFileDto;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DesignJobDto {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerPlace;
    private Long designerId;
    private String designerName;
    /** DesignStatus name. */
    private String status;
    private Integer queuePosition;
    private LocalDate dueDate;
    private String priority;
    /** What to design (design_requirements). */
    private String brief;
    private Integer revisionCount;
    private LocalDateTime assignedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime completionSeenAt;
    private LocalDateTime updatedAt;
    /** Open work past its due date (business timezone). */
    private Boolean overdue;
    /** The designer has not seen the assignment / latest admin change. */
    private Boolean newForDesigner;
    /** Completed and not yet seen by an admin. */
    private Boolean newForAdmin;
    private Integer unreadForAdmin;
    private Integer unreadForDesigner;
    private Integer noteCount;
    private Integer fileCount;
    private DesignNoteDto latestNote;
    /** Detail only. */
    private List<DesignNoteDto> notes;
    /** Detail only. */
    private List<DesignPhaseFileDto> files;
}
