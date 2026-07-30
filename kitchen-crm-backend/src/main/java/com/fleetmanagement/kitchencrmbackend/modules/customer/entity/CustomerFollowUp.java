package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One follow-up interaction with a customer (call/visit/... + notes). When the entry sets
 * a next-follow-up time, a CustomerReminder is created so the header bell notifies then.
 */
@Entity
@Table(name = "customer_followups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerFollowUp extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "followup_type", nullable = false)
    private FollowUpType followupType = FollowUpType.CALL;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "next_follow_up_at")
    private LocalDateTime nextFollowUpAt;

    @Column(name = "created_by")
    private String createdBy;

    public enum FollowUpType {
        CALL, WHATSAPP, MEETING, SITE_VISIT, EMAIL, OTHER
    }
}
