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

    public enum ReminderStatus {
        PENDING, DUE, DONE
    }
}
