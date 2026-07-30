package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerFollowUp;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerFollowUpDto {
    private Long id;

    @NotNull(message = "Customer ID is required")
    private Long customerId;
    private String customerName;

    private CustomerFollowUp.FollowUpType followupType;
    private String notes;
    private LocalDateTime nextFollowUpAt;
    private String createdBy;
    private LocalDateTime createdAt;
}
