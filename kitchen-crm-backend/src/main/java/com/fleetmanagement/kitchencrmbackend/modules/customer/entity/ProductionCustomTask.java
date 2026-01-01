package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "production_custom_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductionCustomTask extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_installation_id", nullable = false)
    private ProductionInstallation productionInstallation;

    @Column(name = "task_title", nullable = false)
    private String taskTitle;

    @Column(name = "task_description", columnDefinition = "TEXT")
    private String taskDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "phase")
    private TaskPhase phase = TaskPhase.CUSTOM;

    @Column(name = "completed", nullable = false)
    private Boolean completed = false;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by_user_id")
    private User completedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_group_id")
    private ProductionTaskGroup taskGroup;

    public enum TaskPhase {
        PRODUCTION,
        SITE_PREPARATION,
        DELIVERY,
        INSTALLATION,
        COMPLETION,
        CUSTOM
    }

    public enum TaskPriority {
        LOW, MEDIUM, HIGH, URGENT
    }
}
