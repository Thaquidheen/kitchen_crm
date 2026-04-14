package com.fleetmanagement.kitchencrmbackend.modules.product.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "inner_panel_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InnerPanelType extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "rate_per_sqft", precision = 10, scale = 2, nullable = false)
    private BigDecimal ratePerSqft;

    @Column(name = "multiplier", precision = 5, scale = 2, nullable = false)
    private BigDecimal multiplier = BigDecimal.ONE;

    private String description;

    @Column(nullable = false)
    private Boolean active = true;
}
