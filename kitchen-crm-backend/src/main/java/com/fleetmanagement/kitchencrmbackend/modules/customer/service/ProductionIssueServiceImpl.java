package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionIssueCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionIssueDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionIssueUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionInstallation;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionIssue;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionInstallationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionIssueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductionIssueServiceImpl implements ProductionIssueService {

    private final ProductionIssueRepository issueRepository;
    private final ProductionInstallationRepository productionInstallationRepository;

    @Override
    @Transactional
    public ApiResponse<ProductionIssueDto> createIssue(ProductionIssueCreateDto createDto, String reportedBy) {
        try {
            ProductionInstallation productionInstallation = productionInstallationRepository
                    .findByCustomerId(createDto.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Production installation not found for customer ID: " + createDto.getCustomerId()));

            ProductionIssue issue = ProductionIssue.builder()
                    .productionInstallation(productionInstallation)
                    .title(createDto.getTitle())
                    .description(createDto.getDescription())
                    .category(createDto.getCategory())
                    .priority(createDto.getPriority())
                    .status(ProductionIssue.IssueStatus.OPEN)
                    .reportedBy(reportedBy)
                    .assignedTo(createDto.getAssignedTo())
                    .build();

            ProductionIssue savedIssue = issueRepository.save(issue);
            log.info("Created production issue ID: {} for customer ID: {}", savedIssue.getId(), createDto.getCustomerId());

            return ApiResponse.success("Issue reported successfully", mapToDto(savedIssue));
        } catch (Exception e) {
            log.error("Error creating production issue: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to create issue: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<ProductionIssueDto> getIssueById(Long issueId) {
        try {
            ProductionIssue issue = issueRepository.findById(issueId)
                    .orElseThrow(() -> new RuntimeException("Issue not found with ID: " + issueId));

            return ApiResponse.success(mapToDto(issue));
        } catch (Exception e) {
            log.error("Error fetching issue: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to fetch issue: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<ProductionIssueDto>> getIssuesByCustomerId(Long customerId) {
        try {
            List<ProductionIssue> issues = issueRepository.findByCustomerId(customerId);
            List<ProductionIssueDto> issueDtos = issues.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());

            return ApiResponse.success(issueDtos);
        } catch (Exception e) {
            log.error("Error fetching issues for customer: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to fetch issues: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<ProductionIssueDto>> getIssuesByStatus(ProductionIssue.IssueStatus status) {
        try {
            List<ProductionIssue> issues = issueRepository.findByStatus(status);
            List<ProductionIssueDto> issueDtos = issues.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());

            return ApiResponse.success(issueDtos);
        } catch (Exception e) {
            log.error("Error fetching issues by status: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to fetch issues: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ApiResponse<ProductionIssueDto> updateIssue(Long issueId, ProductionIssueUpdateDto updateDto, String updatedBy) {
        try {
            ProductionIssue issue = issueRepository.findById(issueId)
                    .orElseThrow(() -> new RuntimeException("Issue not found with ID: " + issueId));

            if (updateDto.getTitle() != null) {
                issue.setTitle(updateDto.getTitle());
            }
            if (updateDto.getDescription() != null) {
                issue.setDescription(updateDto.getDescription());
            }
            if (updateDto.getCategory() != null) {
                issue.setCategory(updateDto.getCategory());
            }
            if (updateDto.getPriority() != null) {
                issue.setPriority(updateDto.getPriority());
            }
            if (updateDto.getStatus() != null) {
                issue.setStatus(updateDto.getStatus());
            }
            if (updateDto.getAssignedTo() != null) {
                issue.setAssignedTo(updateDto.getAssignedTo());
            }
            if (updateDto.getResolution() != null) {
                issue.setResolution(updateDto.getResolution());
            }

            ProductionIssue savedIssue = issueRepository.save(issue);
            log.info("Updated production issue ID: {} by {}", issueId, updatedBy);

            return ApiResponse.success("Issue updated successfully", mapToDto(savedIssue));
        } catch (Exception e) {
            log.error("Error updating issue: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to update issue: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ApiResponse<ProductionIssueDto> resolveIssue(Long issueId, String resolution, String resolvedBy) {
        try {
            ProductionIssue issue = issueRepository.findById(issueId)
                    .orElseThrow(() -> new RuntimeException("Issue not found with ID: " + issueId));

            issue.setStatus(ProductionIssue.IssueStatus.RESOLVED);
            issue.setResolution(resolution);
            issue.setResolvedBy(resolvedBy);
            issue.setResolvedAt(LocalDateTime.now());

            ProductionIssue savedIssue = issueRepository.save(issue);
            log.info("Resolved production issue ID: {} by {}", issueId, resolvedBy);

            return ApiResponse.success("Issue resolved successfully", mapToDto(savedIssue));
        } catch (Exception e) {
            log.error("Error resolving issue: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to resolve issue: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ApiResponse<Void> deleteIssue(Long issueId) {
        try {
            if (!issueRepository.existsById(issueId)) {
                return ApiResponse.error("Issue not found with ID: " + issueId);
            }

            issueRepository.deleteById(issueId);
            log.info("Deleted production issue ID: {}", issueId);

            return ApiResponse.success("Issue deleted successfully", null);
        } catch (Exception e) {
            log.error("Error deleting issue: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to delete issue: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<Long> countOpenIssuesByCustomerId(Long customerId) {
        try {
            Long count = issueRepository.countOpenIssuesByCustomerId(customerId);
            return ApiResponse.success(count);
        } catch (Exception e) {
            log.error("Error counting open issues: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to count issues: " + e.getMessage());
        }
    }

    private ProductionIssueDto mapToDto(ProductionIssue issue) {
        return ProductionIssueDto.builder()
                .id(issue.getId())
                .productionInstallationId(issue.getProductionInstallation().getId())
                .customerId(issue.getProductionInstallation().getCustomer().getId())
                .customerName(issue.getProductionInstallation().getCustomer().getName())
                .title(issue.getTitle())
                .description(issue.getDescription())
                .category(issue.getCategory())
                .priority(issue.getPriority())
                .status(issue.getStatus())
                .reportedBy(issue.getReportedBy())
                .assignedTo(issue.getAssignedTo())
                .resolution(issue.getResolution())
                .resolvedAt(issue.getResolvedAt())
                .resolvedBy(issue.getResolvedBy())
                .createdAt(issue.getCreatedAt())
                .updatedAt(issue.getUpdatedAt())
                .build();
    }
}
