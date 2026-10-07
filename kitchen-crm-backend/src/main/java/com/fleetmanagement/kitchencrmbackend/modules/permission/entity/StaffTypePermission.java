package com.fleetmanagement.kitchencrmbackend.modules.permission.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** What the administrator decided for one permission of one staff type (V157). */
@Entity
@Table(name = "staff_type_permissions")
@Getter
@Setter
@NoArgsConstructor
public class StaffTypePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ADMIN_STAFF | DESIGNER | SALES | NONE */
    @Column(name = "staff_type", nullable = false, length = 20)
    private String staffType;

    @Column(name = "permission_key", nullable = false, length = 60)
    private String permissionKey;

    @Column(name = "allowed", nullable = false)
    private Boolean allowed;

    @Column(name = "updated_by_user_id")
    private Long updatedByUserId;

    @Column(name = "updated_by_name")
    private String updatedByName;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
