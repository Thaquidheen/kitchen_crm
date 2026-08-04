package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One person involved in a customer's project — an architect, a builder, or whoever referred
 * them. A customer can have several, in any mix.
 *
 * <p>This is deliberately separate from {@link Customer#getLeadSourceType()}: that records the
 * channel the customer arrived through (one choice), this records who is involved (a list). A
 * customer can be an online lead and still have an architect on the project.
 *
 * <p>ARCHITECT and BUILDER point at an {@link Architect} row so the partner is reusable across
 * customers; REFERRAL carries free text instead. Rows are rebuilt wholesale on every customer
 * save, so like {@code ApplianceCustomerItem} this is deliberately not Auditable.
 *
 * <p>The table and column keep their pre-V95 names on purpose. Production runs
 * {@code ddl-auto: validate} and the rollback path is "new schema + previous jar"; that jar maps
 * {@code customer_lead_sources.source_type}, so renaming either would stop it booting — the very
 * failure the dead columns on {@link Customer} are kept to avoid. V95 changed which rows live
 * here, not what they are called.
 */
@Entity
@Table(name = "customer_lead_sources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProjectNetworkMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Convert(converter = MemberTypeConverter.class)
    @Column(name = "source_type", nullable = false, length = 30)
    private MemberType memberType;

    /** Set for ARCHITECT / BUILDER, null for REFERRAL. */
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

    public enum MemberType {
        ARCHITECT, BUILDER, REFERRAL;

        /** Points at a reusable Architect/Builder record rather than carrying free text. */
        public boolean isLinked() {
            return this == ARCHITECT || this == BUILDER;
        }

        /**
         * Maps a pre-V95 {@code source_type} onto this enum. Returns null for the values that
         * described a channel rather than a person — those live on the customer now, and a
         * stale frontend bundle sending one should have it dropped, not rejected.
         */
        public static MemberType fromLegacy(String legacy) {
            if (legacy == null) {
                return null;
            }
            return switch (legacy.trim().toUpperCase()) {
                case "ARCHITECT" -> ARCHITECT;
                case "BUILDER" -> BUILDER;
                case "REFERRAL", "MANUAL", "MANUAL_REFERRAL", "BUILDER_REFERRAL", "CONSULTED" -> REFERRAL;
                default -> null;
            };
        }
    }

    /**
     * Maps {@link MemberType} onto the pre-V95 {@code source_type} spellings.
     *
     * <p>REFERRAL is written as MANUAL_REFERRAL because the previous jar's enum has no REFERRAL
     * constant and would throw reading the row — which would break the rollback path just as
     * surely as renaming the column. Reading accepts every legacy spelling and yields null for
     * the channel values, which V95 deleted and {@code convertToDto} filters out defensively.
     */
    @Converter
    public static class MemberTypeConverter implements AttributeConverter<MemberType, String> {

        @Override
        public String convertToDatabaseColumn(MemberType type) {
            if (type == null) {
                return null;
            }
            return type == MemberType.REFERRAL ? "MANUAL_REFERRAL" : type.name();
        }

        @Override
        public MemberType convertToEntityAttribute(String column) {
            return MemberType.fromLegacy(column);
        }
    }
}
