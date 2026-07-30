package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

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

    // Lead tracking fields
    private Long architectId;
    private String architectName;
    private Customer.LeadSourceType leadSourceType;
    private String manualLeadName;
    private String manualLeadContact;

    // Source details (Architect / Builder / Consulted / Manual)
    private String referralName;
    private String referralContact;
    private String referralLocation;
    private String referralDesignation;
    private String referralFirm;
    private String referralEmail;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}