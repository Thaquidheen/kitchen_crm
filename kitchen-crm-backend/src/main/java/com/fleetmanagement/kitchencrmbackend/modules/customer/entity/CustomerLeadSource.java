package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One way a customer came to us. A customer can have several — two architects and a builder,
 * say — which is why this replaced the flat lead-source columns on {@code customers} (V92).
 *
 * <p>ARCHITECT and BUILDER sources point at an {@link Architect} row so the partner is reusable
 * across customers; the other types carry free text instead. Rows are rebuilt wholesale on every
 * customer save, so like {@code ApplianceCustomerItem} this is deliberately not Auditable.
 */
@Entity
@Table(name = "customer_lead_sources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerLeadSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 30)
    private Customer.LeadSourceType sourceType;

    /** Set for ARCHITECT / BUILDER. Null for the free-text types, and for legacy rows. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "architect_id")
    private Architect architect;

    @Column(name = "referral_name")
    private String referralName;

    @Column(name = "referral_contact")
    private String referralContact;

    @Column(name = "referral_location")
    private String referralLocation;

    @Column(name = "referral_designation")
    private String referralDesignation;

    @Column(name = "referral_firm")
    private String referralFirm;

    @Column(name = "referral_email")
    private String referralEmail;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
