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
    /** The customer's pipeline stage (CustomerStatus name). */
    private String customerStatus;
    private Long designerId;
    private String designerName;
    /** DesignStatus name. */
    private String status;
    /** Version in work, or the last one approved. 1 for a first design. */
    private Integer version;
    /** How the current version came to be: DESIGNER or UPLOADED. */
    private String origin;
    /** When the current version was approved; null while it is open. */
    private LocalDateTime approvedAt;
    private String approvedByName;
    private Integer queuePosition;
    private LocalDate dueDate;
    private String priority;
    /** What to design (design_requirements); for a redesign, what has to change. */
    private String brief;
    /** Rounds of "changes requested" by the admin during review. */
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
    /** Design files of the current version (plan documents are counted separately). */
    private Integer fileCount;
    /** Plan documents the admin attached for the designer, all versions. */
    private Integer planDocumentCount;
    /** Newest design PDF of the current version — the file a quotation is made from. */
    private DesignPhaseFileDto currentDesignFile;
    private DesignNoteDto latestNote;
    /** Detail only. */
    private List<DesignNoteDto> notes;
    /** Detail only: design files of the current version. */
    private List<DesignPhaseFileDto> files;
    /** Detail only: plan documents from the admin, newest version first. */
    private List<DesignPhaseFileDto> planDocuments;
    /** Detail only: every version, oldest first, each with its own design files. */
    private List<DesignVersionDto> versions;
}
