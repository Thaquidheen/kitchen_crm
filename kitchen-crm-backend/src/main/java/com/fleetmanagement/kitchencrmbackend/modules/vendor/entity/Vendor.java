package com.fleetmanagement.kitchencrmbackend.modules.vendor.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "vendors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vendor extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vendor_name", nullable = false)
    private String vendorName;

    @Column(name = "contact_person")
    private String contactPerson;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "vendor_type", nullable = false)
    private VendorType vendorType = VendorType.OTHER;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public enum VendorType {
        MATERIAL_SUPPLIER,
        LABOR_CONTRACTOR,
        TRANSPORT_SERVICE,
        APPLIANCE_VENDOR,
        OTHER
    }
}
