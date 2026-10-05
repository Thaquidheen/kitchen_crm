package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class QuotationJobDto {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerPlace;
    private String customerStatus;
    private Long assigneeId;
    private String assigneeName;
    /** WAITING | IN_PROGRESS | COMPLETED | CANCELLED */
    private String status;
    private String priority;
    private LocalDate dueDate;
    private Boolean overdue;
    private String note;
    /** Place in the assignee's queue, 1 = first (open jobs only). */
    private Integer position;
    private String assignedByName;
    private LocalDateTime assignedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String completedByName;
    /** The quotation handed in (completed jobs). */
    private QuotationRefDto quotation;
    /** The customer's quotations, newest first (open jobs): what can be opened or handed in. */
    private List<QuotationRefDto> customerQuotations = new ArrayList<>();
    /** News for the assignee: newly assigned, or the admin changed something. */
    private Boolean newForAssignee;
    private String assigneeNews;
    /** News for whoever manages the board: completed and not looked at yet. */
    private Boolean newlyCompleted;
    /** Why this is in the caller's bell: NEW | CHANGED | OVERDUE | COMPLETED (feed only). */
    private String feedKind;
}
