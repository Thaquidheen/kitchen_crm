package com.fleetmanagement.kitchencrmbackend.modules.measurement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * One customer's site measurements: the room layout (JSON, drives which fields exist) plus one
 * {@link SiteMeasurementValue} per measured field. Saved as a whole from the measuring screen.
 */
@Entity
@Table(name = "site_measurements")
@Getter
@Setter
@NoArgsConstructor
public class SiteMeasurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Plain id, not a relation: the measuring screen never needs the customer graph, and the
    // FK (ON DELETE CASCADE) keeps the row from outliving its customer.
    @Column(name = "customer_id", nullable = false, unique = true)
    private Long customerId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "layout", columnDefinition = "json")
    private Map<String, Object> layout;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "updated_by")
    private String updatedBy;

    // App-set in the business timezone, like the rest of the app's stamps.
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "siteMeasurement", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<SiteMeasurementValue> values = new ArrayList<>();
}
