package com.fleetmanagement.kitchencrmbackend.modules.architect.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "architects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Architect extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "architecture_name", nullable = false)
    private String architectureName;

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
}




