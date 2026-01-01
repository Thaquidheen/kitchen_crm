package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "design_phase_files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DesignPhaseFile extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "design_phase_id", nullable = false)
    private DesignPhase designPhase;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "original_file_name", nullable = false)
    private String originalFileName;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_type")
    private String fileType;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_category")
    private FileCategory fileCategory = FileCategory.DESIGN;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    public enum FileCategory {
        DESIGN,           // Design files (CAD, 3D models)
        PLAN,             // Floor plans, layouts
        REFERENCE,        // Reference images
        TECHNICAL,        // Technical drawings
        DOCUMENT,         // Documents, reports
        OTHER             // Other files
    }
}
