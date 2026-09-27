package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * How to talk to one model of Bluetooth laser meter. {@code config} is the adapter JSON the
 * browser runs on; key/name/active are mirrored as columns and kept in step by the service.
 */
@Entity
@Table(name = "laser_meter_adapters")
@Getter
@Setter
@NoArgsConstructor
public class LaserMeterAdapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "adapter_key", nullable = false, unique = true, length = 64)
    private String adapterKey;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "config", nullable = false, columnDefinition = "json")
    private Map<String, Object> config;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
