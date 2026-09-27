package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/** A Device Lab session (GATT layout, raw packets, marked readings) saved for developers. */
@Entity
@Table(name = "device_lab_logs")
@Getter
@Setter
@NoArgsConstructor
public class DeviceLabLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "device_name", length = 200)
    private String deviceName;

    @Column(name = "adapter_key", length = 64)
    private String adapterKey;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "entry_count", nullable = false)
    private Integer entryCount = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "log", nullable = false, columnDefinition = "json")
    private Map<String, Object> log;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
