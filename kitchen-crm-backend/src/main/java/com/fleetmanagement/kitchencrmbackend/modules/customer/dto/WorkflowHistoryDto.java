package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowHistoryDto {
    private Long id;
    private Long customerId;
    private String customerName;
    private String previousState;
    private String newState;
    private String changedBy;
    private String changeReason;
    private LocalDateTime timestamp;
}