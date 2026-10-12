package com.fleetmanagement.kitchencrmbackend.modules.quotation.editrequest;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A request to put a completed quotation back to Draft so it can be edited (V158). Made by staff
 * who may not change a quotation's status; decided by the admin.
 */
@Entity
@Table(name = "quotation_edit_requests")
@Getter
@Setter
@NoArgsConstructor
public class QuotationEditRequest extends Auditable {

    public static final String PENDING = "PENDING";
    public static final String APPROVED = "APPROVED";
    public static final String REFUSED = "REFUSED";
    /** Approved, edited, and marked completed again. */
    public static final String DONE = "DONE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quotation_id", nullable = false)
    private Long quotationId;

    @Column(name = "requested_by_user_id", nullable = false)
    private Long requestedByUserId;

    @Column(name = "requested_by_name")
    private String requestedByName;

    @Column(name = "reason", length = 500)
    private String reason;

    /** PENDING | APPROVED | REFUSED | DONE */
    @Column(name = "status", nullable = false, length = 20)
    private String status = PENDING;

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
