package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/** One change to an adapter, with the config before and after. Never updated; FK-free. */
@Entity
@Table(name = "laser_meter_adapter_audit")
@Getter
@Setter
@NoArgsConstructor
public class LaserMeterAdapterAudit {

    public enum Action { CREATE, UPDATE, DELETE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "adapter_id")
    private Long adapterId;

    @Column(name = "adapter_key", nullable = false, length = 64)
    private String adapterKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private Action action;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "before_config", columnDefinition = "json")
    private Map<String, Object> beforeConfig;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "after_config", columnDefinition = "json")
    private Map<String, Object> afterConfig;

    @Column(name = "actor_email")
    private String actorEmail;

    @Column(name = "actor_name")
    private String actorName;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
