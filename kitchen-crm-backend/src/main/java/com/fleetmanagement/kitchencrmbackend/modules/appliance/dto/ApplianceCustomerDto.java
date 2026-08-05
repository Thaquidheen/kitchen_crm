package com.fleetmanagement.kitchencrmbackend.modules.appliance.dto;

import com.fleetmanagement.kitchencrmbackend.modules.appliance.entity.ApplianceCustomer;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApplianceCustomerDto {
    private Long id;

    @NotBlank(message = "Customer name is required")
    private String name;

    @NotBlank(message = "Contact is required")
    private String contact;

    private ApplianceCustomer.Category category;
    private String brand;
    private BigDecimal amount;
    private ApplianceCustomer.Status status;
    private String notes;
    // Set by the upload endpoints, never by create/update — see ApplianceCustomerServiceImpl.
    private List<ApplianceQuotationFileDto> quotationFiles;
    private List<String> items;
    private String createdBy;
    private LocalDateTime createdAt;
}
