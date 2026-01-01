package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhaseFile;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DesignPhaseFileDto {

    private Long id;
    private Long designPhaseId;
    private Long customerId;
    private String customerName;
    private String fileName;
    private String originalFileName;
    private String fileUrl;
    private Long fileSize;
    private String fileType;
    private DesignPhaseFile.FileCategory fileCategory;
    private String description;
    private String uploadedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
