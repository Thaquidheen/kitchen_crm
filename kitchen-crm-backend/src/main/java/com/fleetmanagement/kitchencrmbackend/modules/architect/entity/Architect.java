package com.fleetmanagement.kitchencrmbackend.modules.architect.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * An architect or a builder. Both are the same shape and share visit tracking, so one table
 * holds both and {@link PartnerType} tells them apart — see V91. A plain enum column rather
 * than JPA inheritance, so a mis-typed record can be corrected with an ordinary update.
 */
@Entity
@Table(name = "architects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@BatchSize(size = 50)
public class Architect extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "architecture_name", nullable = false)
    private String architectureName;

    @Enumerated(EnumType.STRING)
    @Column(name = "partner_type", nullable = false, length = 20)
    private PartnerType partnerType = PartnerType.ARCHITECT;

    @Column(name = "firm")
    private String firm;

    @Column(name = "contact_number")
    private String contactNumber;

    @Column(name = "principal_architect_name")
    private String principalArchitectName;

    @Column(name = "last_visit_date")
    private LocalDateTime lastVisitDate;

    @OneToMany(mappedBy = "architect", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ArchitectVisit> visits = new ArrayList<>();

    public enum PartnerType {
        ARCHITECT, BUILDER
    }
}




