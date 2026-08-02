package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One entry in a customer's lead-source list.
 *
 * <p>For ARCHITECT / BUILDER the client sends {@code architectId}; the architect* fields are a
 * server-populated read-only projection of that record, so the UI can show the partner's firm
 * and phone without a second request. For the free-text types the referral* fields are used.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LeadSourceDto {

    private Long id;

    @NotNull(message = "Lead source type is required")
    private Customer.LeadSourceType sourceType;

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
}
