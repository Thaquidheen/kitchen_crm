package com.fleetmanagement.kitchencrmbackend.modules.architect.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One note in an architect/builder's running history. Append-only — each new note is its own row,
 * so the full history is preserved (the customer notes feed works the same way).
 */
@Entity
@Table(name = "architect_notes")
@Getter
@Setter
@NoArgsConstructor
public class ArchitectNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "architect_id", nullable = false)
    private Architect architect;

    @Column(name = "note", nullable = false, columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_by")
    private String createdBy;

    // App-set in the business timezone so it lines up with everything else the app displays.
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
