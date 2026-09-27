package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.modules.appliance.entity.ApplianceCustomer;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A follow-up reminder (what to do + when), owned by EITHER a customer or an Appliance &amp;
 * Quartz entry — exactly one of the two is set. The service layer enforces that invariant;
 * MySQL cannot express it as a constraint here.
 *
 * Reminders work at day granularity: a reminder is visible for the whole of its own date,
 * from 00:00, and stays visible until marked DONE.
 */
@Entity
@Table(name = "customer_reminders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerReminder extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Exactly one owner is set — see the class comment.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appliance_customer_id")
    private ApplianceCustomer applianceCustomer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "architect_id")
    private com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect architect;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "remind_at", nullable = false)
    private LocalDateTime remindAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReminderStatus status = ReminderStatus.PENDING;

    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;

    @Column(name = "created_by")
    private String createdBy;

    /**
     * Creator, as a real user id. Visibility is gated on this: staff see only their own rows,
     * a super admin sees all. NULL means a legacy row whose creator could not be resolved from
     * the old display-name column (V117) - those stay super-admin-only rather than being guessed.
     */
    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    /**
     * Which flow created this reminder, so the bell and the Reminders page can filter by module.
     * Production and follow-up rows used to be indistinguishable from manual ones (V102).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    private ReminderSource source = ReminderSource.MANUAL;

    public enum ReminderStatus {
        PENDING, DUE, DONE
    }

    public enum ReminderSource {
        MANUAL, FOLLOW_UP, PRODUCTION, ARCHITECT
    }
}
