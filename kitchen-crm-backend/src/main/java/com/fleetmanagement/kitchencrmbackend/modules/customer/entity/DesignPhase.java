package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "design_phase")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DesignPhase extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(columnDefinition = "TEXT")
    private String plan;

    @Column(name = "quotation_id")
    private Long quotationId;

    @Column(columnDefinition = "TEXT")
    private String design;

    @Column(name = "submitted_to_client")
    private Boolean submittedToClient = false;

    @Column(name = "client_feedback", columnDefinition = "TEXT")
    private String clientFeedback;

    @Column(name = "meeting_scheduled")
    private LocalDateTime meetingScheduled;

    @Column(name = "design_amount_frozen")
    private Boolean designAmountFrozen = false;

    @Column(name = "client_group_created")
    private Boolean clientGroupCreated = false;
}