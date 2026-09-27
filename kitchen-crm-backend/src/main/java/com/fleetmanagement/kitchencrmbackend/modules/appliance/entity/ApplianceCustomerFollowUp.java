package com.fleetmanagement.kitchencrmbackend.modules.appliance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One follow-up call logged against an Appliance &amp; Quartz entry. Append-only — each call is its
 * own row so the full history is kept (the architect notes feed works the same way). The parent's
 * {@code lastCalledAt} is a denormalised MAX(calledAt) that the service keeps in step.
 */
@Entity
@Table(name = "appliance_customer_followups")
@Getter
@Setter
@NoArgsConstructor
public class ApplianceCustomerFollowUp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appliance_customer_id", nullable = false)
    private ApplianceCustomer applianceCustomer;

    // User-entered call time, stored as a naive business-timezone wall-clock like reminders.
    @Column(name = "called_at", nullable = false)
    private LocalDateTime calledAt;

    @Column(name = "note", nullable = false, columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_by")
    private String createdBy;

    /** Creator id — the note text is private to its author (NULL = legacy row, admin only). */
    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    // App-set in the business timezone so it lines up with everything else the app displays.
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
