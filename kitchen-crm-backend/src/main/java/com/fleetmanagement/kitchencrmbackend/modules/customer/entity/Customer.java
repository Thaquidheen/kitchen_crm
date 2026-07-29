package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "architect_id")
    private Architect architect;

    @Enumerated(EnumType.STRING)
    @Column(name = "lead_source_type")
    private LeadSourceType leadSourceType = LeadSourceType.NONE;

    @Column(name = "manual_lead_name")
    private String manualLeadName;

    @Column(name = "manual_lead_contact")
    private String manualLeadContact;

    // Referrer details (used when leadSourceType is BUILDER_REFERRAL or MANUAL_REFERRAL)
    @Column(name = "referral_name")
    private String referralName;

    @Column(name = "referral_contact")
    private String referralContact;

    @Column(name = "referral_location")
    private String referralLocation;

    @Column(name = "referral_designation")
    private String referralDesignation;

    public enum CustomerStatus {
        LEAD, POTENTIAL, DESIGN_STAGE, QUOTE_GIVEN, FOLLOW_UP, NEGOTIATIONS, CONFIRMED, LOST
    }

    public enum LeadSourceType {
        // MANUAL is legacy (replaced by MANUAL_REFERRAL); kept so old rows still deserialize.
        NONE, ARCHITECT, MANUAL, ONLINE, WALK_IN, SCOUTING, BUILDER_REFERRAL, MANUAL_REFERRAL
    }
}