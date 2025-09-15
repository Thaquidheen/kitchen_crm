package com.fleetmanagement.kitchencrmbackend.modules.product.dto;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Sensor;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SensorDto {
    private Long id;

    @NotNull(message = "Sensor type is required")
    private Sensor.SensorType type;

    @NotNull(message = "Price per piece is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal pricePerPiece;

    @NotNull(message = "MRP is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "MRP must be greater than 0")
    private BigDecimal mrp;

    private BigDecimal discountPercentage = BigDecimal.ZERO;
    private BigDecimal companyPrice;
    private Boolean active = true;
}