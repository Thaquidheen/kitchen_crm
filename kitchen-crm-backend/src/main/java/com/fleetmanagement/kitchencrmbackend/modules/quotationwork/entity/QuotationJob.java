package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.entity;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A customer's quotation handed to one person to prepare (V156). Status and priority are plain
 * text columns, so new values never need a schema change.
 */
@Entity
@Table(name = "quotation_jobs")
@Getter
@Setter
@NoArgsConstructor
public class QuotationJob extends Auditable {

    public static final String WAITING = "WAITING";
    public static final String IN_PROGRESS = "IN_PROGRESS";
    public static final String COMPLETED = "COMPLETED";
    public static final String CANCELLED = "CANCELLED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "assignee_user_id", nullable = false)
    private Long assigneeUserId;

    @Column(name = "assignee_name")
    private String assigneeName;

    /** WAITING | IN_PROGRESS | COMPLETED | CANCELLED */
    @Column(name = "status", nullable = false, length = 20)
    private String status = WAITING;

    /** LOW | MEDIUM | HIGH | URGENT (null = MEDIUM). */
    @Column(name = "priority", length = 20)
    private String priority;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    /** Order in the assignee's queue; 1 = do first. */
    @Column(name = "queue_position")
    private Integer queuePosition;

    /** The quotation handed in at completion. */
    @Column(name = "quotation_id")
    private Long quotationId;

    @Column(name = "assigned_by_user_id")
    private Long assignedByUserId;

    @Column(name = "assigned_by_name")
    private String assignedByName;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed_by_user_id")
    private Long completedByUserId;

    @Column(name = "completed_by_name")
    private String completedByName;

    /** Assignee has seen the assignment / latest change; null = news in their bell. */
    @Column(name = "assignee_seen_at")
    private LocalDateTime assigneeSeenAt;

    /** What changed since the assignee last looked (null = newly assigned). */
    @Column(name = "assignee_news")
    private String assigneeNews;

    /** Admin has seen the completion; null on a completed job = news in the admin bell. */
    @Column(name = "admin_seen_at")
    private LocalDateTime adminSeenAt;

    /** Same for Admin staff, who look at the board separately from the admin. */
    @Column(name = "coordinator_seen_at")
    private LocalDateTime coordinatorSeenAt;
}
