package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionIssueCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionIssueDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionIssueUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionIssue;

import java.util.List;

public interface ProductionIssueService {

    ApiResponse<ProductionIssueDto> createIssue(ProductionIssueCreateDto createDto, String reportedBy);

    ApiResponse<ProductionIssueDto> getIssueById(Long issueId);

    ApiResponse<List<ProductionIssueDto>> getIssuesByCustomerId(Long customerId);

    ApiResponse<List<ProductionIssueDto>> getIssuesByStatus(ProductionIssue.IssueStatus status);

    ApiResponse<ProductionIssueDto> updateIssue(Long issueId, ProductionIssueUpdateDto updateDto, String updatedBy);

    ApiResponse<ProductionIssueDto> resolveIssue(Long issueId, String resolution, String resolvedBy);

    ApiResponse<Void> deleteIssue(Long issueId);

    ApiResponse<Long> countOpenIssuesByCustomerId(Long customerId);
}
