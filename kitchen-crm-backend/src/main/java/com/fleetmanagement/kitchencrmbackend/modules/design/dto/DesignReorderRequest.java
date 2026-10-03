package com.fleetmanagement.kitchencrmbackend.modules.design.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DesignReorderRequest {
    @NotNull(message = "Designer is required")
    private Long designerId;
    /** Job ids in the new order; the first is done first. */
    @NotNull(message = "Order is required")
    private List<Long> jobIds;
}
