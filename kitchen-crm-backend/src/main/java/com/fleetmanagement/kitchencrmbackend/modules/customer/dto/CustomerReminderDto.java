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

    @NotNull(message = "Customer ID is required")
    private Long customerId;
    private String customerName;

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
