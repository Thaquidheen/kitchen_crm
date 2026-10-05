package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class QuotationJobReorderRequest {
    @NotNull(message = "Assignee is required")
    private Long assigneeId;
    /** That person's open jobs, first to do first. */
    private List<Long> jobIds = new ArrayList<>();
}
