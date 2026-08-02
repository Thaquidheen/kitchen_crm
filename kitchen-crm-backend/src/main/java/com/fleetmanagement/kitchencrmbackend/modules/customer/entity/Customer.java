package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Customer extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String contact;

    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "kitchen_types")
    private String kitchenTypes;

    // Sales-tracker fields (Excel: SQFT / PLACE / CONTACTING PERSON AND DESIGNATION / FOLLOW UP NOTES)
    @Column(name = "sqft")
    private String sqft;

    @Column(name = "place")
    private String place;

    @Column(name = "contact_person")
    private String contactPerson;

    @Column(name = "follow_up_notes", columnDefinition = "TEXT")
    private String followUpNotes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CustomerStatus status = CustomerStatus.LEAD;

    /**
     * How this customer came to us. An empty list means no lead source — {@code NONE} is never
     * persisted as a row. Replaces the flat columns below; see V92/V93.
     */
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 50)
    private List<CustomerLeadSource> leadSources = new ArrayList<>();

    // ---------------------------------------------------------------------------------------
    // Legacy single-lead-source columns. Superseded by leadSources, but kept for one release:
    // production runs ddl-auto=validate, so dropping them would stop the previous jar booting
    // and remove the rollback path. CustomerServiceImpl mirrors the first source into them.
    // ---------------------------------------------------------------------------------------

    /** @deprecated use {@link #leadSources}. */
    @Deprecated
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "architect_id")
    private Architect architect;

    /** @deprecated use {@link #leadSources}. */
    @Deprecated
    @Enumerated(EnumType.STRING)
    @Column(name = "lead_source_type")
    private LeadSourceType leadSourceType = LeadSourceType.NONE;

    /** @deprecated use {@link #leadSources}. */
    @Deprecated
    @Column(name = "manual_lead_name")
    private String manualLeadName;

    /** @deprecated use {@link #leadSources}. */
    @Deprecated
    @Column(name = "manual_lead_contact")
    private String manualLeadContact;

    /** @deprecated use {@link #leadSources}. */
    @Deprecated
    @Column(name = "referral_name")
    private String referralName;

    /** @deprecated use {@link #leadSources}. */
    @Deprecated
    @Column(name = "referral_contact")
    private String referralContact;

    /** @deprecated use {@link #leadSources}. */
    @Deprecated
    @Column(name = "referral_location")
    private String referralLocation;

    /** @deprecated use {@link #leadSources}. */
    @Deprecated
    @Column(name = "referral_designation")
    private String referralDesignation;

    /** @deprecated use {@link #leadSources}. */
    @Deprecated
    @Column(name = "referral_firm")
    private String referralFirm;

    /** @deprecated use {@link #leadSources}. */
    @Deprecated
    @Column(name = "referral_email")
    private String referralEmail;

    /** Keeps both sides of the association in step. Never reassign the list — that breaks orphanRemoval. */
    public void addLeadSource(CustomerLeadSource source) {
        source.setCustomer(this);
        this.leadSources.add(source);
    }

    public void clearLeadSources() {
        this.leadSources.clear();
    }

    public enum CustomerStatus {
        LEAD, POTENTIAL, DESIGN_STAGE, QUOTE_GIVEN, FOLLOW_UP, NEGOTIATIONS, CONFIRMED, LOST
    }

    public enum LeadSourceType {
        // MANUAL is legacy (replaced by MANUAL_REFERRAL); kept so old rows still deserialize.
        // BUILDER links an architects row with partner_type=BUILDER; BUILDER_REFERRAL is the
        // older free-text builder and is no longer offered when creating a source.
        NONE, ARCHITECT, BUILDER, MANUAL, ONLINE, WALK_IN, SCOUTING,
        BUILDER_REFERRAL, MANUAL_REFERRAL, CONSULTED;

        /** Points at a reusable Architect/Builder record rather than carrying free text. */
        public boolean isLinked() {
            return this == ARCHITECT || this == BUILDER;
        }

        /** Carries free-text referrer details instead of a linked record. */
        public boolean isFreeText() {
            return this == BUILDER_REFERRAL || this == MANUAL_REFERRAL
                    || this == CONSULTED || this == MANUAL;
        }
    }
}