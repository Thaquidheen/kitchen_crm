package com.fleetmanagement.kitchencrmbackend.modules.warranty.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "warranty_components")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "component_name", nullable = false, length = 255)
    private String componentName;

    @Column(name = "warranty_period", nullable = false, length = 100)
    private String warrantyPeriod;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "active")
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}


