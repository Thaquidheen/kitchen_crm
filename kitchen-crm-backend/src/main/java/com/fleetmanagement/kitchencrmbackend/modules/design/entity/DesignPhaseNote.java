package com.fleetmanagement.kitchencrmbackend.modules.design.entity;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** One message in the admin <-> designer note thread of a design job (V153). */
@Entity
@Table(name = "design_phase_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DesignPhaseNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "design_phase_id", nullable = false)
    private DesignPhase designPhase;

    @Column(name = "author_user_id")
    private Long authorUserId;

    @Column(name = "author_name")
    private String authorName;

    /** true = written by the assigned designer, false = by an admin. */
    @Column(name = "from_designer", nullable = false)
    private Boolean fromDesigner;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** Design version this note was written under (V155). Null on older notes = 1. */
    @Column(name = "version_no")
    private Integer versionNo;
}
