package com.fleetmanagement.kitchencrmbackend.modules.product.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BrandDto {
    private Long id;

    @NotBlank(message = "Brand name is required")
    private String name;

    private String description;
    private Boolean active = true;
}