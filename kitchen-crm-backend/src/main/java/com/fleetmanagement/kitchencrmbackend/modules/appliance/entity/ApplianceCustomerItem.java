package com.fleetmanagement.kitchencrmbackend.modules.appliance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "appliance_customer_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApplianceCustomerItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appliance_customer_id", nullable = false)
    private ApplianceCustomer applianceCustomer;

    @Column(name = "item_name", nullable = false, length = 500)
    private String itemName;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
