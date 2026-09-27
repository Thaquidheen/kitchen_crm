package com.fleetmanagement.kitchencrmbackend.modules.measurement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** One measured field, in integer millimetres, with where the value came from. */
@Entity
@Table(name = "site_measurement_values")
@Getter
@Setter
@NoArgsConstructor
public class SiteMeasurementValue {

    public static final String SOURCE_LASER_BLE = "laser_ble";
    public static final String SOURCE_LASER_HID = "laser_hid";
    public static final String SOURCE_MANUAL = "manual";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_measurement_id", nullable = false)
    private SiteMeasurement siteMeasurement;

    @Column(name = "field_key", nullable = false, length = 120)
    private String fieldKey;

    @Column(name = "value_mm", nullable = false)
    private Integer valueMm;

    /** laser_ble | laser_hid | manual — kept lowercase to match the API. */
    @Column(name = "source", nullable = false, length = 20)
    private String source;

    @Column(name = "device_adapter_id", length = 64)
    private String deviceAdapterId;

    @Column(name = "raw", length = 500)
    private String raw;

    @Column(name = "captured_at", nullable = false)
    private LocalDateTime capturedAt;

    @Column(name = "edited_after_capture", nullable = false)
    private Boolean editedAfterCapture = false;
}
