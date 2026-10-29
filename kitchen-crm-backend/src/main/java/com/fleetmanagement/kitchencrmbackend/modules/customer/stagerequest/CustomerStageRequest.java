package com.fleetmanagement.kitchencrmbackend.modules.customer.stagerequest;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A request to move a Follow Up customer back to Design Stage or Quotation Stage (V164). Made by
 * staff; decided by the admin.
 */
@Entity
@Table(name = "customer_stage_requests")
@Getter
@Setter
@NoArgsConstructor
public class CustomerStageRequest extends Auditable {

    public static final String PENDING = "PENDING";
    public static final String APPROVED = "APPROVED";
    public static final String REFUSED = "REFUSED";
    /** Withdrawn by whoever asked, or overtaken by another move of the customer. */
    public static final String CANCELLED = "CANCELLED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "from_stage", nullable = false, length = 32)
    private String fromStage;

    @Column(name = "to_stage", nullable = false, length = 32)
    private String toStage;

    @Column(name = "reason", length = 500)
    private String reason;

    /** PENDING | APPROVED | REFUSED | CANCELLED */
    @Column(name = "status", nullable = false, length = 20)
    private String status = PENDING;

    @Column(name = "requested_by_user_id", nullable = false)
    private Long requestedByUserId;

    @Column(name = "requested_by_name")
    private String requestedByName;

    @Column(name = "decided_by_user_id")
    private Long decidedByUserId;

    @Column(name = "decided_by_name")
    private String decidedByName;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "decision_note", length = 500)
    private String decisionNote;

    /** Null on a decided request = the person who asked has not seen the answer yet. */
    @Column(name = "requester_seen_at")
    private LocalDateTime requesterSeenAt;
}
