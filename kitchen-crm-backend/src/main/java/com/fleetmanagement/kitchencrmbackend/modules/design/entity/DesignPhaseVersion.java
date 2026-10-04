package com.fleetmanagement.kitchencrmbackend.modules.design.entity;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One version of a customer's design (V155). Version 1 is the first design; every redesign after
 * an approval opens the next one. A version is either made by an assigned designer or uploaded as
 * an already existing design. {@code approvedAt} null means it is still open (or was cancelled).
 */
@Entity
@Table(name = "design_phase_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DesignPhaseVersion {

    public static final String ORIGIN_DESIGNER = "DESIGNER";
    public static final String ORIGIN_UPLOADED = "UPLOADED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "design_phase_id", nullable = false)
    private DesignPhase designPhase;

    @Column(name = "version_no", nullable = false)
    private Integer versionNo;

    /** DESIGNER | UPLOADED */
    @Column(name = "origin", nullable = false, length = 20)
    private String origin;

    @Column(name = "designer_user_id")
    private Long designerUserId;

    @Column(name = "designer_name")
    private String designerName;

    /** The brief for version 1; what has to change for later versions. */
    @Column(name = "request_note", columnDefinition = "TEXT")
    private String requestNote;

    @Column(name = "requested_by_user_id")
    private Long requestedByUserId;

    @Column(name = "requested_by_name")
    private String requestedByName;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by_user_id")
    private Long approvedByUserId;

    @Column(name = "approved_by_name")
    private String approvedByName;
}
