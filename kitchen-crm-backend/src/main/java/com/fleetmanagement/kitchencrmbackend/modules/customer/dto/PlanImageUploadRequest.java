package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerPlanImage;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlanImageUploadRequest {
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Image type is required")
    private CustomerPlanImage.ImageType imageType;

    private String description; // Optional description for the image
}