package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    // Initial status (defaults to LEAD if not provided)
    private Customer.CustomerStatus status;

    // Lead tracking fields
    private Customer.LeadSourceType leadSourceType;
    private Long architectId;
    private String manualLeadName;
    private String manualLeadContact;

    // Referrer details (Builder Referral / Manual Referral)
    private String referralName;
    private String referralContact;
    private String referralLocation;
    private String referralDesignation;
}