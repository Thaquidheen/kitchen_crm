package com.fleetmanagement.kitchencrmbackend.modules.appliance.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * A customer buying appliances (hob/hood/fridge/oven...) or quartz — quoted and
 * tracked separately from kitchen quotations. Items are manually entered rows.
 */
@Entity
@Table(name = "appliance_customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApplianceCustomer extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "contact", nullable = false)
    private String contact;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private Category category = Category.APPLIANCE;

    @Column(name = "brand")
    private String brand;

    @Column(name = "amount", precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.ENQUIRY;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by")
    private String createdBy;

    @OneToMany(mappedBy = "applianceCustomer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    private List<ApplianceCustomerItem> items = new ArrayList<>();

    public enum Category {
        APPLIANCE, QUARTZ
    }

    public enum Status {
        ENQUIRY, ORDERED, DELIVERED
    }
}
