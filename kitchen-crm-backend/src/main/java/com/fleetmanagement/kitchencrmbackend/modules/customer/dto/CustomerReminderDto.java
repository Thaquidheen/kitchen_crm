package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerReminder;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerReminderDto {
    private Long id;

    // Owner: either a customer or an Appliance & Quartz entry. Exactly one must be supplied
    // on create; the service rejects zero or both.
    private Long customerId;
    private String customerName;
    private Long applianceCustomerId;

    /** CUSTOMER | APPLIANCE — which module this reminder belongs to. */
    private String ownerType;
    /** Id of the owning record within that module. */
    private Long ownerId;
    /** Display name of the owner, whichever module it came from. */
    private String ownerName;

    @NotBlank(message = "Reminder title is required")
    private String title;

    private String notes;

    @NotNull(message = "Reminder date/time is required")
    private LocalDateTime remindAt;

    private CustomerReminder.ReminderStatus status;
    private LocalDateTime notifiedAt;
    private String createdBy;
    private LocalDateTime createdAt;

    // Derived server-side so the browser never re-does the date maths in its own timezone.
    // A reminder belongs to the whole of its calendar day: the time of day is a note, not a trigger.
    private LocalDate remindDate;
    /** TODAY | OVERDUE | UPCOMING | DONE */
    private String bucket;
}
