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

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCreateDto {
    @NotBlank(message = "Customer name is required")
    private String name;

    private String contact;

    @Email(message = "Email should be valid")
    private String email;

    private String address;
    private String kitchenTypes;

    // Sales-tracker fields
    private String sqft;
    private String place;
    private String contactPerson;
    private String followUpNotes;

    // Initial status (defaults to LEAD if not provided)
    private Customer.CustomerStatus status;

    /** Everyone involved in this customer's project. Null or empty means nobody. */
    @Valid
    @Size(max = 20, message = "At most 20 project network members")
    private List<ProjectNetworkMemberDto> projectNetwork;

    /** The channel this customer arrived through — one choice, independent of the network. */
    private Customer.LeadSourceType leadSourceType;

    /** @deprecated pre-V95 name for {@link #projectNetwork}; accepted for one release. */
    @Deprecated
    @Valid
    @Size(max = 20, message = "At most 20 project network members")
    private List<ProjectNetworkMemberDto> leadSources;

    // Legacy flat referrer fields, still accepted so an older cached bundle keeps working.
    private Long architectId;
    private String manualLeadName;
    private String manualLeadContact;

    private String referralName;
    private String referralContact;
    private String referralLocation;
    private String referralDesignation;
    private String referralFirm;
    private String referralEmail;
}