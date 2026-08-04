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
     * Who is involved in this customer's project — architects, builders, whoever referred them.
     * Independent of {@link #leadSourceType}: an online lead can still have an architect on the
     * project. See V95.
     */
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 50)
    private List<CustomerProjectNetworkMember> projectNetwork = new ArrayList<>();

    /**
     * The channel this customer arrived through — one choice, set straight from the form.
     *
     * <p>V92 demoted this to a mirror of the first lead-source row; V95 made it authoritative
     * again when the two ideas were split apart.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "lead_source_type")
    private LeadSourceType leadSourceType = LeadSourceType.NONE;

    // ---------------------------------------------------------------------------------------
    // Legacy flat referrer columns. Superseded by projectNetwork, but kept: production runs
    // ddl-auto=validate, so dropping them would stop the previous jar booting and remove the
    // rollback path. Nothing writes them any more; they are read only as a fallback for rows
    // last saved before V92.
    // ---------------------------------------------------------------------------------------

    /** @deprecated use {@link #projectNetwork}. */
    @Deprecated
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "architect_id")
    private Architect architect;

    /** @deprecated use {@link #projectNetwork}. */
    @Deprecated
    @Column(name = "manual_lead_name")
    private String manualLeadName;

    /** @deprecated use {@link #projectNetwork}. */
    @Deprecated
    @Column(name = "manual_lead_contact")
    private String manualLeadContact;

    /** @deprecated use {@link #projectNetwork}. */
    @Deprecated
    @Column(name = "referral_name")
    private String referralName;

    /** @deprecated use {@link #projectNetwork}. */
    @Deprecated
    @Column(name = "referral_contact")
    private String referralContact;

    /** @deprecated use {@link #projectNetwork}. */
    @Deprecated
    @Column(name = "referral_location")
    private String referralLocation;

    /** @deprecated use {@link #projectNetwork}. */
    @Deprecated
    @Column(name = "referral_designation")
    private String referralDesignation;

    /** @deprecated use {@link #projectNetwork}. */
    @Deprecated
    @Column(name = "referral_firm")
    private String referralFirm;

    /** @deprecated use {@link #projectNetwork}. */
    @Deprecated
    @Column(name = "referral_email")
    private String referralEmail;

    /** Keeps both sides of the association in step. Never reassign the list — that breaks orphanRemoval. */
    public void addProjectNetworkMember(CustomerProjectNetworkMember member) {
        member.setCustomer(this);
        this.projectNetwork.add(member);
    }

    public void clearProjectNetwork() {
        this.projectNetwork.clear();
    }

    public enum CustomerStatus {
        LEAD, POTENTIAL, DESIGN_STAGE, QUOTE_GIVEN, FOLLOW_UP, NEGOTIATIONS, CONFIRMED, LOST
    }

    /**
     * The channel a customer arrived through. MANUAL and BUILDER_REFERRAL are superseded by
     * MANUAL_REFERRAL and BUILDER but are kept so existing rows still deserialize — the form
     * offers the current values only.
     */
    public enum LeadSourceType {
        NONE, ARCHITECT, BUILDER, MANUAL, ONLINE, WALK_IN, SCOUTING,
        BUILDER_REFERRAL, MANUAL_REFERRAL, CONSULTED
    }
}