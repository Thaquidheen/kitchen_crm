package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationOtherExpenseDto {
    private Long id;
    private String name;
    private BigDecimal amount = BigDecimal.ZERO;
    private Boolean isDefault = false;
}
