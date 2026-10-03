package com.fleetmanagement.kitchencrmbackend.modules.task.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** One message in the reply thread of an assigned task (V152). */
@Entity
@Table(name = "employee_task_replies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTaskReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private EmployeeTask task;

    @Column(name = "author_user_id")
    private Long authorUserId;

    @Column(name = "author_name")
    private String authorName;

    /** true = written by the assignee (staff), false = by the assigner (admin). */
    @Column(name = "from_assignee", nullable = false)
    private Boolean fromAssignee;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
