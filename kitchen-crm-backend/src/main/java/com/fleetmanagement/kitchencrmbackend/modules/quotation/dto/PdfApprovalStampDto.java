package com.fleetmanagement.kitchencrmbackend.modules.quotation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdfApprovalStampDto {
    private String approverName;
    private String approverEmail;
    private LocalDateTime approvalDate;
    private String ipAddress;
    private String additionalNotes;
}
