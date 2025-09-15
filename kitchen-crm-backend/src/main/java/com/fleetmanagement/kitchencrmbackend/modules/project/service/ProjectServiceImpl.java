package com.fleetmanagement.kitchencrmbackend.modules.project.service;

import com.fleetmanagement.kitchencrmbackend.modules.project.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import com.fleetmanagement.kitchencrmbackend.modules.project.repository.CustomerProjectRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectServiceImpl implements ProjectService {

    @Autowired
    private CustomerProjectRepository projectRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Override
    public ApiResponse<Page<ProjectSummaryDto>> getAllProjects(Long customerId,
                                                               CustomerProject.ProjectStatus status,
                                                               String projectName,
                                                               LocalDate fromDate,
                                                               LocalDate toDate,
                                                               Pageable pageable) {
        Page<CustomerProject> projects = projectRepository.findByFilters(
                customerId, status, projectName, fromDate, toDate, pageable);

        Page<ProjectSummaryDto> projectDtos = projects.map(this::convertToSummaryDto);
        return ApiResponse.success(projectDtos);
    }

    @Override
    public ApiResponse<ProjectDto> getProjectById(Long id) {
        CustomerProject project = projectRepository.findById(id).orElse(null);
        if (project == null) {
            return ApiResponse.error("Project not found");
        }
        return ApiResponse.success(convertToDto(project));
    }

    @Override
    public ApiResponse<List<ProjectSummaryDto>> getProjectsByCustomer(Long customerId) {
        List<CustomerProject> projects = projectRepository.findByCustomerId(customerId);
        List<ProjectSummaryDto> projectDtos = projects.stream()
                .map(this::convertToSummaryDto)
                .collect(Collectors.toList());
        return ApiResponse.success(projectDtos);
    }

    @Override
    public ApiResponse<ProjectDto> createProject(ProjectCreateDto projectCreateDto, String createdBy) {
        // Validate customer exists
        Customer customer = customerRepository.findById(projectCreateDto.getCustomerId()).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }

        // Check if quotation exists and is not already converted
        Quotation quotation = null;
        if (projectCreateDto.getQuotationId() != null) {
            quotation = quotationRepository.findById(projectCreateDto.getQuotationId()).orElse(null);
            if (quotation == null) {
                return ApiResponse.error("Quotation not found");
            }

            // Check if quotation is already converted to project
            if (projectRepository.findByQuotationId(projectCreateDto.getQuotationId()).isPresent()) {
                return ApiResponse.error("Quotation is already converted to a project");
            }
        }

        CustomerProject project = new CustomerProject();
        project.setCustomer(customer);
        project.setQuotation(quotation);
        project.setProjectName(projectCreateDto.getProjectName());
        project.setProjectDescription(projectCreateDto.getProjectDescription());
        project.setStartDate(projectCreateDto.getStartDate());
        project.setExpectedCompletionDate(projectCreateDto.getExpectedCompletionDate());
        project.setCreatedBy(createdBy);
        project.setStatus(CustomerProject.ProjectStatus.ACTIVE);

        // Set amounts from quotation if available
        if (quotation != null) {
            project.setTotalAmount(quotation.getTotalAmount());
            project.setTotalTaxAmount(quotation.getTaxAmount());
        } else {
            project.setTotalAmount(projectCreateDto.getTotalAmount());
            project.setTotalTaxAmount(projectCreateDto.getTotalTaxAmount());
        }

        CustomerProject savedProject = projectRepository.save(project);
        return ApiResponse.success("Project created successfully", convertToDto(savedProject));
    }

    @Override
    public ApiResponse<ProjectDto> updateProject(Long id, ProjectDto projectDto, String updatedBy) {
        CustomerProject existingProject = projectRepository.findById(id).orElse(null);
        if (existingProject == null) {
            return ApiResponse.error("Project not found");
        }

        // Update project details
        existingProject.setProjectName(projectDto.getProjectName());
        existingProject.setProjectDescription(projectDto.getProjectDescription());
        existingProject.setStartDate(projectDto.getStartDate());
        existingProject.setExpectedCompletionDate(projectDto.getExpectedCompletionDate());
        existingProject.setActualCompletionDate(projectDto.getActualCompletionDate());
        existingProject.setTotalAmount(projectDto.getTotalAmount());
        existingProject.setTotalTaxAmount(projectDto.getTotalTaxAmount());
        existingProject.setCashInHand(projectDto.getCashInHand());
        existingProject.setCashInAccount(projectDto.getCashInAccount());
        existingProject.setReceivedAmountTotal(projectDto.getReceivedAmountTotal());
        existingProject.setTotalExpense(projectDto.getTotalExpense());
        existingProject.setStatus(projectDto.getStatus());

        CustomerProject updatedProject = projectRepository.save(existingProject);
        return ApiResponse.success("Project updated successfully", convertToDto(updatedProject));
    }

    @Override
    public ApiResponse<String> deleteProject(Long id) {
        CustomerProject project = projectRepository.findById(id).orElse(null);
        if (project == null) {
            return ApiResponse.error("Project not found");
        }

        // Soft delete by changing status to cancelled
        project.setStatus(CustomerProject.ProjectStatus.CANCELLED);
        projectRepository.save(project);

        return ApiResponse.success("Project deleted successfully");
    }

    @Override
    public ApiResponse<ProjectDto> convertQuotationToProject(Long quotationId, String createdBy) {
        Quotation quotation = quotationRepository.findById(quotationId).orElse(null);
        if (quotation == null) {
            return ApiResponse.error("Quotation not found");
        }

        // Check if already converted
        if (projectRepository.findByQuotationId(quotationId).isPresent()) {
            return ApiResponse.error("Quotation is already converted to a project");
        }

        // Check if quotation is approved
        if (quotation.getStatus() != Quotation.QuotationStatus.APPROVED) {
            return ApiResponse.error("Only approved quotations can be converted to projects");
        }

        CustomerProject project = new CustomerProject();
        project.setCustomer(quotation.getCustomer());
        project.setQuotation(quotation);
        project.setProjectName(quotation.getProjectName() != null ?
                quotation.getProjectName() :
                "Project for " + quotation.getCustomer().getName());
        project.setTotalAmount(quotation.getTotalAmount());
        project.setTotalTaxAmount(quotation.getTaxAmount());
        project.setStartDate(LocalDate.now());
        project.setCreatedBy(createdBy);
        project.setStatus(CustomerProject.ProjectStatus.ACTIVE);

        CustomerProject savedProject = projectRepository.save(project);
        return ApiResponse.success("Quotation converted to project successfully", convertToDto(savedProject));
    }

    @Override
    public ApiResponse<String> updateProjectStatus(Long id, CustomerProject.ProjectStatus status, String updatedBy) {
        CustomerProject project = projectRepository.findById(id).orElse(null);
        if (project == null) {
            return ApiResponse.error("Project not found");
        }

        CustomerProject.ProjectStatus previousStatus = project.getStatus();
        project.setStatus(status);

        // Set completion date if project is completed
        if (status == CustomerProject.ProjectStatus.COMPLETED && project.getActualCompletionDate() == null) {
            project.setActualCompletionDate(LocalDate.now());
        }

        projectRepository.save(project);

        return ApiResponse.success("Project status updated from " + previousStatus + " to " + status);
    }

    @Override
    public ApiResponse<Map<String, Object>> getProjectStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Project counts by status
        for (CustomerProject.ProjectStatus status : CustomerProject.ProjectStatus.values()) {
            Long count = projectRepository.countByStatus(status);
            stats.put(status.name().toLowerCase() + "_projects", count);
        }

        // Total projects
        stats.put("total_projects", projectRepository.count());

        // Active projects with financial summary
        List<CustomerProject> activeProjects = projectRepository.findByFilters(
                null, CustomerProject.ProjectStatus.ACTIVE, null, null, null,
                org.springframework.data.domain.Pageable.unpaged()).getContent();

        BigDecimal totalActiveValue = activeProjects.stream()
                .map(p -> p.getTotalAmount() != null ? p.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalReceived = activeProjects.stream()
                .map(p -> {
                    BigDecimal cash = p.getCashInHand() != null ? p.getCashInHand() : BigDecimal.ZERO;
                    BigDecimal account = p.getCashInAccount() != null ? p.getCashInAccount() : BigDecimal.ZERO;
                    return cash.add(account);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        stats.put("total_active_project_value", totalActiveValue);
        stats.put("total_received_amount", totalReceived);
        stats.put("total_pending_amount", totalActiveValue.subtract(totalReceived));

        return ApiResponse.success(stats);
    }

    @Override
    public ApiResponse<Map<String, Object>> getProjectFinancialSummary(Long projectId) {
        CustomerProject project = projectRepository.findById(projectId).orElse(null);
        if (project == null) {
            return ApiResponse.error("Project not found");
        }

        Map<String, Object> financialSummary = new HashMap<>();

        financialSummary.put("project_id", project.getId());
        financialSummary.put("project_name", project.getProjectName());
        financialSummary.put("total_amount", project.getTotalAmount());
        financialSummary.put("total_tax_amount", project.getTotalTaxAmount());
        financialSummary.put("cash_in_hand", project.getCashInHand());
        financialSummary.put("cash_in_account", project.getCashInAccount());
        financialSummary.put("balance_amount", project.getBalanceAmount());
        financialSummary.put("received_amount_total", project.getReceivedAmountTotal());
        financialSummary.put("total_expense", project.getTotalExpense());

        // Calculate profit/loss
        BigDecimal totalReceived = (project.getCashInHand() != null ? project.getCashInHand() : BigDecimal.ZERO)
                .add(project.getCashInAccount() != null ? project.getCashInAccount() : BigDecimal.ZERO);
        BigDecimal profit = totalReceived.subtract(project.getTotalExpense() != null ? project.getTotalExpense() : BigDecimal.ZERO);

        financialSummary.put("profit_loss", profit);
        financialSummary.put("payment_completion_percentage",
                project.getTotalAmount().compareTo(BigDecimal.ZERO) > 0 ?
                        totalReceived.multiply(BigDecimal.valueOf(100)).divide(project.getTotalAmount(), 2, java.math.RoundingMode.HALF_UP) :
                        BigDecimal.ZERO);

        return ApiResponse.success(financialSummary);
    }

    // Helper methods for DTO conversion
    private ProjectDto convertToDto(CustomerProject project) {
        ProjectDto dto = new ProjectDto();
        dto.setId(project.getId());
        dto.setCustomerId(project.getCustomer().getId());
        dto.setCustomerName(project.getCustomer().getName());

        if (project.getQuotation() != null) {
            dto.setQuotationId(project.getQuotation().getId());
            dto.setQuotationNumber(project.getQuotation().getQuotationNumber());
        }

        dto.setProjectName(project.getProjectName());
        dto.setTotalAmount(project.getTotalAmount());
        dto.setTotalTaxAmount(project.getTotalTaxAmount());
        dto.setCashInHand(project.getCashInHand());
        dto.setCashInAccount(project.getCashInAccount());
        dto.setBalanceAmount(project.getBalanceAmount());
        dto.setReceivedAmountTotal(project.getReceivedAmountTotal());
        dto.setTotalExpense(project.getTotalExpense());
        dto.setStatus(project.getStatus());
        dto.setStartDate(project.getStartDate());
        dto.setExpectedCompletionDate(project.getExpectedCompletionDate());
        dto.setActualCompletionDate(project.getActualCompletionDate());
        dto.setProjectDescription(project.getProjectDescription());
        dto.setCreatedBy(project.getCreatedBy());
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());

        return dto;
    }

    private ProjectSummaryDto convertToSummaryDto(CustomerProject project) {
        return new ProjectSummaryDto(
                project.getId(),
                project.getProjectName(),
                project.getCustomer().getId(),
                project.getCustomer().getName(),
                project.getTotalAmount(),
                project.getBalanceAmount(),
                project.getStatus(),
                project.getStartDate(),
                project.getExpectedCompletionDate(),
                project.getCreatedBy()
        );
    }
}