package com.fleetmanagement.kitchencrmbackend.modules.audit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One audit event: a sign-in (successful or failed), a logout, or a write action against a
 * module. Deliberately FK-free — failed logins carry emails that match no user row, and audit
 * rows must survive user deletion. Never updated after insert.
 */
@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 20)
    private EventType eventType;

    @Column(name = "actor_email")
    private String actorEmail;

    @Column(name = "actor_name")
    private String actorName;

    @Column(name = "actor_role", length = 30)
    private String actorRole;

    /** Backend module package for ACTION rows (customer, quotation, finance, …). */
    @Column(name = "module", length = 40)
    private String module;

    @Column(name = "http_method", length = 10)
    private String httpMethod;

    @Column(name = "summary", length = 500)
    private String summary;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", length = 300)
    private String userAgent;

    // App-set (like workflow_history.timestamp) so date-range filters compare like with like;
    // the column's DB default is only a safety net.
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum EventType {
        LOGIN, LOGIN_FAILED, LOGOUT, ACTION
    }
}
