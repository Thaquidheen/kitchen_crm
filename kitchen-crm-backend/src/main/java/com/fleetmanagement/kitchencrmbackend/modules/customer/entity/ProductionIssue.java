package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "production_issues")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_installation_id", nullable = false)
    private ProductionInstallation productionInstallation;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssuePriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueStatus status;

    private String reportedBy;

    private String assignedTo;

    @Column(columnDefinition = "TEXT")
    private String resolution;

    private LocalDateTime resolvedAt;

    private String resolvedBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum IssueCategory {
        MATERIAL_DEFECT,
        MEASUREMENT_ERROR,
        INSTALLATION_DAMAGE,
        DELIVERY_DELAY,
        QUALITY_ISSUE,
        SITE_ISSUE,
        DESIGN_CHANGE,
        OTHER
    }

    public enum IssuePriority {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public enum IssueStatus {
        OPEN,
        IN_PROGRESS,
        RESOLVED,
        CLOSED
    }
}
