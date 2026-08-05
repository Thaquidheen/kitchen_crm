package com.fleetmanagement.kitchencrmbackend.modules.appliance.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApplianceQuotationFileDto {
    private Long id;
    private String fileUrl;
    private String fileName;
    private LocalDateTime uploadedAt;
}
