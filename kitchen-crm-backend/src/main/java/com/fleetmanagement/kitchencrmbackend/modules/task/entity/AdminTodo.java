package com.fleetmanagement.kitchencrmbackend.modules.task.entity;

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
@Table(name = "admin_todos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminTodo extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "todo_title", nullable = false)
    private String todoTitle;

    @Column(name = "todo_description", columnDefinition = "TEXT")
    private String todoDescription;

    @Column(name = "todo_date")
    private LocalDate todoDate;

    @Column(name = "completed", nullable = false)
    private Boolean completed = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private TodoPriority priority = TodoPriority.MEDIUM;

    @Column(name = "category")
    private String category;

    public enum TodoPriority {
        LOW, MEDIUM, HIGH, URGENT
    }
}




