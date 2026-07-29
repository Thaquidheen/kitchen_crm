package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A follow-up reminder attached to a customer (what to do + when). The scheduler flips
 * PENDING -> DUE when remind_at passes; DUE reminders feed the header-bell notifications
 * until marked DONE.
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

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
