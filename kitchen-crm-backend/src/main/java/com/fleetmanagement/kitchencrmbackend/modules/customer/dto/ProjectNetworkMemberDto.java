package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerProjectNetworkMember;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One person in a customer's project network.
 *
 * <p>For ARCHITECT / BUILDER the client sends {@code architectId}; the architect* fields are a
 * server-populated read-only projection of that record, so the UI can show the partner's firm
 * and phone without a second request. REFERRAL uses the referral* fields instead.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectNetworkMemberDto {

    private Long id;

    private CustomerProjectNetworkMember.MemberType memberType;

    /**
     * Pre-V95 name for {@link #memberType}, kept for one release so a cached older frontend
     * bundle still saves. A String rather than the enum because its legacy values (MANUAL_REFERRAL
     * and friends) no longer parse — {@code fromLegacy} folds them in instead of 400-ing.
     */
    @Deprecated
    private String sourceType;

    private Long architectId;

    // Read-only projection of the linked architects row; ignored on write.
    private String architectName;
    private String architectFirm;
    private String architectContact;
    private Architect.PartnerType architectPartnerType;

    private String referralName;
    private String referralContact;
    private String referralLocation;
    private String referralDesignation;
    private String referralFirm;
    private String referralEmail;

    /** Echoed on read. On write, the order of the incoming list wins. */
    private Integer sortOrder;

    /** The type to persist: the current field if the client sent it, else the legacy one. */
    public CustomerProjectNetworkMember.MemberType effectiveType() {
        return memberType != null
                ? memberType
                : CustomerProjectNetworkMember.MemberType.fromLegacy(sourceType);
    }
}
