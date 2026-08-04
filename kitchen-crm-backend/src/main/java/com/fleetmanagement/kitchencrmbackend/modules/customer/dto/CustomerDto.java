package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDto {
    private Long id;

    @NotBlank(message = "Customer name is required")
    private String name;

    private String contact;

    @Email(message = "Email should be valid")
    private String email;

    private String address;
    private String kitchenTypes;
    private Customer.CustomerStatus status;

    // Sales-tracker fields
    private String sqft;
    private String place;
    private String contactPerson;
    private String followUpNotes;

    /**
     * Everyone involved in this customer's project. On update: omit (or null) to leave them
     * untouched, send an empty list to clear them, send a list to replace them wholesale.
     * {@code @Valid} is required for the nested constraints to be checked.
     */
    @Valid
    @Size(max = 20, message = "At most 20 project network members")
    private List<ProjectNetworkMemberDto> projectNetwork;

    /** The channel this customer arrived through — one choice, independent of the network. */
    private Customer.LeadSourceType leadSourceType;

    /**
     * Pre-V95 name for {@link #projectNetwork}, still read and written for one release so a
     * cached older frontend bundle keeps working across the deploy.
     *
     * @deprecated use {@link #projectNetwork}.
     */
    @Deprecated
    @Valid
    @Size(max = 20, message = "At most 20 project network members")
    private List<ProjectNetworkMemberDto> leadSources;

    // Legacy flat referrer fields, still emitted so older frontend bundles keep rendering.
    // Removed with the columns in a later release.
    private Long architectId;
    private String architectName;
    private String manualLeadName;
    private String manualLeadContact;

    private String referralName;
    private String referralContact;
    private String referralLocation;
    private String referralDesignation;
    private String referralFirm;
    private String referralEmail;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}