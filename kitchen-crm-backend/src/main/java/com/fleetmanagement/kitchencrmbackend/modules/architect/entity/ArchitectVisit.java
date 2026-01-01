package com.fleetmanagement.kitchencrmbackend.modules.architect.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "architect_visits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ArchitectVisit extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "architect_id", nullable = false)
    private Architect architect;

    @Column(name = "visit_date", nullable = false)
    private LocalDateTime visitDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "visited_by", length = 100)
    private String visitedBy;
}







