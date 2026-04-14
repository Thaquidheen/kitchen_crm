package com.fleetmanagement.kitchencrmbackend.modules.product.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Material extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "unit_rate_per_sqft", precision = 10, scale = 2, nullable = false)
    private BigDecimal unitRatePerSqft;

    private String description;

    // BOX_AREA = full cabinet surface area, FACE_AREA = front face only (W×H)
    @Column(name = "calculation_type", nullable = false)
    private String calculationType = "BOX_AREA";

    @Column(nullable = false)
    private Boolean active = true;
}