package com.fleetmanagement.kitchencrmbackend.modules.project.service;

import com.fleetmanagement.kitchencrmbackend.modules.project.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import com.fleetmanagement.kitchencrmbackend.modules.project.repository.CustomerProjectRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationKitchen;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationKitchenRepository;
import com.fleetmanagement.kitchencrmbackend.modules.expense.repository.ProjectExpenseRepository;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.repository.WarrantyCardRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

    @Autowired
    private QuotationKitchenRepository kitchenRepository;

    @Autowired
    private ProjectExpenseRepository projectExpenseRepository;

    @Autowired
    private WarrantyCardRepository warrantyCardRepository;

    @Autowired
    private ObjectMapper objectMapper;

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

        // Update project details only if provided
        if (projectDto.getProjectName() != null) {
            existingProject.setProjectName(projectDto.getProjectName());
        }
        if (projectDto.getProjectDescription() != null) {
            existingProject.setProjectDescription(projectDto.getProjectDescription());
        }
        if (projectDto.getStartDate() != null) {
            existingProject.setStartDate(projectDto.getStartDate());
        }
        if (projectDto.getExpectedCompletionDate() != null) {
            existingProject.setExpectedCompletionDate(projectDto.getExpectedCompletionDate());
        }
        if (projectDto.getActualCompletionDate() != null) {
            existingProject.setActualCompletionDate(projectDto.getActualCompletionDate());
        }
        if (projectDto.getTotalAmount() != null) {
            existingProject.setTotalAmount(projectDto.getTotalAmount());
        }
        if (projectDto.getTotalTaxAmount() != null) {
            existingProject.setTotalTaxAmount(projectDto.getTotalTaxAmount());
        }
        if (projectDto.getCommittedInHand() != null) {
            existingProject.setCommittedInHand(projectDto.getCommittedInHand());
        }
        if (projectDto.getCommittedInAccount() != null) {
            existingProject.setCommittedInAccount(projectDto.getCommittedInAccount());
        }
        if (projectDto.getReceivedInHand() != null) {
            existingProject.setReceivedInHand(projectDto.getReceivedInHand());
        }
        if (projectDto.getReceivedInAccount() != null) {
            existingProject.setReceivedInAccount(projectDto.getReceivedInAccount());
        }
        if (projectDto.getReceivedAmountTotal() != null) {
            existingProject.setReceivedAmountTotal(projectDto.getReceivedAmountTotal());
        }
        if (projectDto.getTotalExpense() != null) {
            existingProject.setTotalExpense(projectDto.getTotalExpense());
        }
        if (projectDto.getStatus() != null) {
            existingProject.setStatus(projectDto.getStatus());
        }

        // Handle quotation update
        if (projectDto.getQuotationId() != null) {
            // If quotationId is being changed (or set for the first time)
            Long newQuotationId = projectDto.getQuotationId();
            Long currentQuotationId = existingProject.getQuotation() != null ? existingProject.getQuotation().getId() : null;

            // Only process if quotation is actually changing
            if (currentQuotationId == null || !newQuotationId.equals(currentQuotationId)) {
                Quotation quotation = quotationRepository.findById(newQuotationId).orElse(null);
                if (quotation == null) {
                    return ApiResponse.error("Quotation not found");
                }

                // Check if quotation is already converted to another project
                Optional<CustomerProject> existingProjectWithQuotation = projectRepository.findByQuotationId(newQuotationId);
                if (existingProjectWithQuotation.isPresent()) {
                    CustomerProject projectWithQuotation = existingProjectWithQuotation.get();
                    // Allow if it's the current project, otherwise error
                    if (!projectWithQuotation.getId().equals(existingProject.getId())) {
                        return ApiResponse.error("Quotation is already associated with another project");
                    }
                }

                // Update quotation association
                existingProject.setQuotation(quotation);

                // Update amounts from quotation
                existingProject.setTotalAmount(quotation.getTotalAmount());
                existingProject.setTotalTaxAmount(quotation.getTaxAmount());
            }
        } else if (projectDto.getQuotationId() == null && existingProject.getQuotation() != null) {
            // Allow removing quotation association by explicitly setting to null
            // (This would be represented as quotationId being null/not provided)
            // For now, we only update if quotationId is explicitly provided
        }

        CustomerProject updatedProject = projectRepository.save(existingProject);
        return ApiResponse.success("Project updated successfully", convertToDto(updatedProject));
    }

    @Override
    public ApiResponse<String> deleteProject(Long id) {
        CustomerProject project = projectRepository.findById(id).orElse(null);
        if (project == null) {
            return ApiResponse.error("Project not found");
        }

        // Delete related expenses (legacy payments rows go with the project via the
        // ON DELETE CASCADE FK on the payments table)
        projectExpenseRepository.deleteByProjectId(id);

        // Unlink quotations and warranty cards (set project_id to NULL)
        quotationRepository.unlinkFromProject(id);
        warrantyCardRepository.unlinkFromProject(id);

        // Permanently delete the project
        projectRepository.delete(project);

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
                .map(p -> p.getReceivedAmountTotal() != null ? p.getReceivedAmountTotal() : BigDecimal.ZERO)
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
        financialSummary.put("committed_in_hand", project.getCommittedInHand());
        financialSummary.put("committed_in_account", project.getCommittedInAccount());
        financialSummary.put("received_in_hand", project.getReceivedInHand());
        financialSummary.put("received_in_account", project.getReceivedInAccount());
        financialSummary.put("balance_in_hand", project.getBalanceInHand());
        financialSummary.put("balance_in_account", project.getBalanceInAccount());
        financialSummary.put("balance_amount", project.getBalanceAmount());
        financialSummary.put("received_amount_total", project.getReceivedAmountTotal());
        financialSummary.put("total_expense", project.getTotalExpense());

        // Calculate profit/loss
        BigDecimal totalReceived = project.getReceivedAmountTotal() != null ? project.getReceivedAmountTotal() : BigDecimal.ZERO;
        BigDecimal profit = totalReceived.subtract(project.getTotalExpense() != null ? project.getTotalExpense() : BigDecimal.ZERO);

        financialSummary.put("profit_loss", profit);
        financialSummary.put("payment_completion_percentage",
                project.getTotalAmount().compareTo(BigDecimal.ZERO) > 0 ?
                        totalReceived.multiply(BigDecimal.valueOf(100)).divide(project.getTotalAmount(), 2, java.math.RoundingMode.HALF_UP) :
                        BigDecimal.ZERO);

        return ApiResponse.success(financialSummary);
    }

    @Override
    public ApiResponse<ProjectCashCalculationDto> getProjectCashCalculation(Long projectId) {
        CustomerProject project = projectRepository.findById(projectId).orElse(null);
        if (project == null) {
            return ApiResponse.error("Project not found");
        }

        if (project.getQuotation() == null) {
            return ApiResponse.error("Project does not have an associated quotation");
        }

        Quotation quotation = project.getQuotation();
        ProjectCashCalculationDto dto = new ProjectCashCalculationDto();

        // Check if quotation has kitchens
        List<QuotationKitchen> kitchens = kitchenRepository.findByQuotationIdOrderByKitchenOrderAsc(quotation.getId());
        
        if (kitchens != null && !kitchens.isEmpty()) {
            // Multi-kitchen mode: Calculate per-kitchen cash calculations
            dto.setIsMultiKitchen(true);
            
            // Set quotation-level tax percentages (used for all kitchens)
            dto.setAccessoriesTaxPercentage(quotation.getAccessoriesTaxPercentage());
            dto.setCabinetsTaxPercentage(quotation.getCabinetsTaxPercentage());
            dto.setDoorsTaxPercentage(quotation.getDoorsTaxPercentage());
            dto.setLightingTaxPercentage(quotation.getLightingTaxPercentage());
            
            // Set transportation and installation (quotation-level)
            dto.setTransportationPrice(quotation.getTransportationPrice());
            dto.setInstallationPrice(quotation.getInstallationPrice());
            
            // Load per-kitchen tax percentages from JSON
            Map<Long, KitchenTaxPercentages> kitchenTaxMap = new HashMap<>();
            if (project.getKitchenTaxPercentagesJson() != null && !project.getKitchenTaxPercentagesJson().trim().isEmpty()) {
                try {
                    Map<String, Map<String, Object>> jsonMap = objectMapper.readValue(
                        project.getKitchenTaxPercentagesJson(),
                        new TypeReference<Map<String, Map<String, Object>>>() {}
                    );
                    for (Map.Entry<String, Map<String, Object>> entry : jsonMap.entrySet()) {
                        Long kitchenId = Long.parseLong(entry.getKey());
                        kitchenTaxMap.put(kitchenId, KitchenTaxPercentages.fromMap(entry.getValue()));
                    }
                } catch (Exception e) {
                    // If JSON parsing fails, use project-level tax percentages as fallback
                    System.err.println("Error parsing kitchen tax percentages JSON: " + e.getMessage());
                }
            }
            
            // Get default edited tax percentages from project (fallback if not set per kitchen)
            BigDecimal defaultEditedAccessoriesTax = project.getAccessoriesTaxPercentage() != null ? 
                project.getAccessoriesTaxPercentage() : quotation.getAccessoriesTaxPercentage();
            BigDecimal defaultEditedCabinetsTax = project.getCabinetsTaxPercentage() != null ? 
                project.getCabinetsTaxPercentage() : quotation.getCabinetsTaxPercentage();
            BigDecimal defaultEditedDoorsTax = project.getDoorsTaxPercentage() != null ? 
                project.getDoorsTaxPercentage() : quotation.getDoorsTaxPercentage();
            BigDecimal defaultEditedLightingTax = project.getLightingTaxPercentage() != null ? 
                project.getLightingTaxPercentage() : quotation.getLightingTaxPercentage();
            
            // Calculate cash for each kitchen
            BigDecimal totalCashInHand = BigDecimal.ZERO;
            BigDecimal totalCashInAccount = BigDecimal.ZERO;
            BigDecimal totalAccessoriesBase = BigDecimal.ZERO;
            BigDecimal totalCabinetsBase = BigDecimal.ZERO;
            BigDecimal totalDoorsBase = BigDecimal.ZERO;
            BigDecimal totalLightingBase = BigDecimal.ZERO;
            BigDecimal totalAccessoriesMargin = BigDecimal.ZERO;
            BigDecimal totalCabinetsMargin = BigDecimal.ZERO;
            BigDecimal totalDoorsMargin = BigDecimal.ZERO;
            BigDecimal totalLightingMargin = BigDecimal.ZERO;
            
            List<KitchenCashCalculationDto> kitchenCashDtos = new ArrayList<>();
            
            for (QuotationKitchen kitchen : kitchens) {
                KitchenCashCalculationDto kitchenDto = new KitchenCashCalculationDto();
                kitchenDto.setKitchenId(kitchen.getId());
                kitchenDto.setKitchenName(kitchen.getKitchenName());
                kitchenDto.setKitchenOrder(kitchen.getKitchenOrder());
                
                // Set kitchen category totals
                kitchenDto.setAccessoriesBaseTotal(kitchen.getAccessoriesBaseTotal());
                kitchenDto.setCabinetsBaseTotal(kitchen.getCabinetsBaseTotal());
                kitchenDto.setDoorsBaseTotal(kitchen.getDoorsBaseTotal());
                kitchenDto.setLightingBaseTotal(kitchen.getLightingBaseTotal());
                
                kitchenDto.setAccessoriesMarginAmount(kitchen.getAccessoriesMarginAmount());
                kitchenDto.setCabinetsMarginAmount(kitchen.getCabinetsMarginAmount());
                kitchenDto.setDoorsMarginAmount(kitchen.getDoorsMarginAmount());
                kitchenDto.setLightingMarginAmount(kitchen.getLightingMarginAmount());
                
                // Set tax percentages (from quotation, same for all kitchens)
                kitchenDto.setAccessoriesTaxPercentage(quotation.getAccessoriesTaxPercentage());
                kitchenDto.setCabinetsTaxPercentage(quotation.getCabinetsTaxPercentage());
                kitchenDto.setDoorsTaxPercentage(quotation.getDoorsTaxPercentage());
                kitchenDto.setLightingTaxPercentage(quotation.getLightingTaxPercentage());
                
                // Get per-kitchen tax percentages or use defaults
                KitchenTaxPercentages kitchenTax = kitchenTaxMap.get(kitchen.getId());
                BigDecimal editedAccessoriesTax = (kitchenTax != null && kitchenTax.getAccessoriesTaxPercentage() != null) ?
                    kitchenTax.getAccessoriesTaxPercentage() : defaultEditedAccessoriesTax;
                BigDecimal editedCabinetsTax = (kitchenTax != null && kitchenTax.getCabinetsTaxPercentage() != null) ?
                    kitchenTax.getCabinetsTaxPercentage() : defaultEditedCabinetsTax;
                BigDecimal editedDoorsTax = (kitchenTax != null && kitchenTax.getDoorsTaxPercentage() != null) ?
                    kitchenTax.getDoorsTaxPercentage() : defaultEditedDoorsTax;
                BigDecimal editedLightingTax = (kitchenTax != null && kitchenTax.getLightingTaxPercentage() != null) ?
                    kitchenTax.getLightingTaxPercentage() : defaultEditedLightingTax;
                
                // Set edited tax percentages (per-kitchen or default)
                kitchenDto.setEditedAccessoriesTaxPercentage(editedAccessoriesTax);
                kitchenDto.setEditedCabinetsTaxPercentage(editedCabinetsTax);
                kitchenDto.setEditedDoorsTaxPercentage(editedDoorsTax);
                kitchenDto.setEditedLightingTaxPercentage(editedLightingTax);
                
                // Calculate cash values for this kitchen
                calculateKitchenCashValues(kitchenDto);
                
                // Accumulate totals
                totalCashInHand = totalCashInHand.add(kitchenDto.getCashInHand());
                totalCashInAccount = totalCashInAccount.add(kitchenDto.getCashInAccount());
                totalAccessoriesBase = totalAccessoriesBase.add(kitchen.getAccessoriesBaseTotal());
                totalCabinetsBase = totalCabinetsBase.add(kitchen.getCabinetsBaseTotal());
                totalDoorsBase = totalDoorsBase.add(kitchen.getDoorsBaseTotal());
                totalLightingBase = totalLightingBase.add(kitchen.getLightingBaseTotal());
                totalAccessoriesMargin = totalAccessoriesMargin.add(kitchen.getAccessoriesMarginAmount());
                totalCabinetsMargin = totalCabinetsMargin.add(kitchen.getCabinetsMarginAmount());
                totalDoorsMargin = totalDoorsMargin.add(kitchen.getDoorsMarginAmount());
                totalLightingMargin = totalLightingMargin.add(kitchen.getLightingMarginAmount());
                
                kitchenCashDtos.add(kitchenDto);
            }
            
            // Add transportation and installation to total cash in hand
            if (quotation.getTransportationPrice() != null) {
                totalCashInHand = totalCashInHand.add(quotation.getTransportationPrice());
            }
            if (quotation.getInstallationPrice() != null) {
                totalCashInHand = totalCashInHand.add(quotation.getInstallationPrice());
            }
            
            // Set aggregated totals for backward compatibility
            dto.setAccessoriesBaseTotal(totalAccessoriesBase);
            dto.setCabinetsBaseTotal(totalCabinetsBase);
            dto.setDoorsBaseTotal(totalDoorsBase);
            dto.setLightingBaseTotal(totalLightingBase);
            dto.setAccessoriesMarginAmount(totalAccessoriesMargin);
            dto.setCabinetsMarginAmount(totalCabinetsMargin);
            dto.setDoorsMarginAmount(totalDoorsMargin);
            dto.setLightingMarginAmount(totalLightingMargin);
            // Use default tax percentages for aggregated totals (backward compatibility)
            dto.setEditedAccessoriesTaxPercentage(defaultEditedAccessoriesTax);
            dto.setEditedCabinetsTaxPercentage(defaultEditedCabinetsTax);
            dto.setEditedDoorsTaxPercentage(defaultEditedDoorsTax);
            dto.setEditedLightingTaxPercentage(defaultEditedLightingTax);
            dto.setCashInHand(totalCashInHand);
            dto.setCashInAccount(totalCashInAccount);
            dto.setKitchens(kitchenCashDtos);
        } else {
            // Single kitchen mode: Use existing logic
            dto.setIsMultiKitchen(false);
            
            // Set base amounts from quotation
            dto.setAccessoriesBaseTotal(quotation.getAccessoriesBaseTotal());
            dto.setCabinetsBaseTotal(quotation.getCabinetsBaseTotal());
            dto.setDoorsBaseTotal(quotation.getDoorsBaseTotal());
            dto.setLightingBaseTotal(quotation.getLightingBaseTotal());

            // Set margin amounts from quotation
            dto.setAccessoriesMarginAmount(quotation.getAccessoriesMarginAmount());
            dto.setCabinetsMarginAmount(quotation.getCabinetsMarginAmount());
            dto.setDoorsMarginAmount(quotation.getDoorsMarginAmount());
            dto.setLightingMarginAmount(quotation.getLightingMarginAmount());

            // Set original tax percentages from quotation
            dto.setAccessoriesTaxPercentage(quotation.getAccessoriesTaxPercentage());
            dto.setCabinetsTaxPercentage(quotation.getCabinetsTaxPercentage());
            dto.setDoorsTaxPercentage(quotation.getDoorsTaxPercentage());
            dto.setLightingTaxPercentage(quotation.getLightingTaxPercentage());

            // Set edited tax percentages from project (if any)
            dto.setEditedAccessoriesTaxPercentage(project.getAccessoriesTaxPercentage());
            dto.setEditedCabinetsTaxPercentage(project.getCabinetsTaxPercentage());
            dto.setEditedDoorsTaxPercentage(project.getDoorsTaxPercentage());
            dto.setEditedLightingTaxPercentage(project.getLightingTaxPercentage());

            // Set transportation and installation
            dto.setTransportationPrice(quotation.getTransportationPrice());
            dto.setInstallationPrice(quotation.getInstallationPrice());

            // Calculate cash in hand and cash in account
            calculateCashValues(dto);
        }

        return ApiResponse.success(dto);
    }

    @Override
    public ApiResponse<ProjectDto> updateProjectCashCalculation(Long projectId, UpdateProjectCashCalculationRequest request, String updatedBy) {
        CustomerProject project = projectRepository.findById(projectId).orElse(null);
        if (project == null) {
            return ApiResponse.error("Project not found");
        }

        if (project.getQuotation() == null) {
            return ApiResponse.error("Project does not have an associated quotation");
        }

        // Update edited tax percentages (project-level, for backward compatibility)
        project.setAccessoriesTaxPercentage(request.getAccessoriesTaxPercentage());
        project.setCabinetsTaxPercentage(request.getCabinetsTaxPercentage());
        project.setDoorsTaxPercentage(request.getDoorsTaxPercentage());
        project.setLightingTaxPercentage(request.getLightingTaxPercentage());
        
        // Save per-kitchen tax percentages as JSON
        if (request.getKitchenTaxPercentages() != null && !request.getKitchenTaxPercentages().isEmpty()) {
            try {
                Map<String, Map<String, BigDecimal>> jsonMap = new HashMap<>();
                for (Map.Entry<Long, KitchenTaxPercentages> entry : request.getKitchenTaxPercentages().entrySet()) {
                    KitchenTaxPercentages ktp = entry.getValue();
                    Map<String, BigDecimal> taxMap = new HashMap<>();
                    taxMap.put("accessoriesTaxPercentage", ktp.getAccessoriesTaxPercentage());
                    taxMap.put("cabinetsTaxPercentage", ktp.getCabinetsTaxPercentage());
                    taxMap.put("doorsTaxPercentage", ktp.getDoorsTaxPercentage());
                    taxMap.put("lightingTaxPercentage", ktp.getLightingTaxPercentage());
                    jsonMap.put(entry.getKey().toString(), taxMap);
                }
                project.setKitchenTaxPercentagesJson(objectMapper.writeValueAsString(jsonMap));
            } catch (Exception e) {
                System.err.println("Error serializing kitchen tax percentages to JSON: " + e.getMessage());
                // Continue without per-kitchen tax percentages if serialization fails
            }
        } else {
            // Clear per-kitchen tax percentages if not provided
            project.setKitchenTaxPercentagesJson(null);
        }

        // Calculate cash in hand and cash in account
        ProjectCashCalculationDto calcDto = new ProjectCashCalculationDto();
        Quotation quotation = project.getQuotation();

        calcDto.setAccessoriesBaseTotal(quotation.getAccessoriesBaseTotal());
        calcDto.setCabinetsBaseTotal(quotation.getCabinetsBaseTotal());
        calcDto.setDoorsBaseTotal(quotation.getDoorsBaseTotal());
        calcDto.setLightingBaseTotal(quotation.getLightingBaseTotal());

        calcDto.setAccessoriesMarginAmount(quotation.getAccessoriesMarginAmount());
        calcDto.setCabinetsMarginAmount(quotation.getCabinetsMarginAmount());
        calcDto.setDoorsMarginAmount(quotation.getDoorsMarginAmount());
        calcDto.setLightingMarginAmount(quotation.getLightingMarginAmount());

        calcDto.setAccessoriesTaxPercentage(quotation.getAccessoriesTaxPercentage());
        calcDto.setCabinetsTaxPercentage(quotation.getCabinetsTaxPercentage());
        calcDto.setDoorsTaxPercentage(quotation.getDoorsTaxPercentage());
        calcDto.setLightingTaxPercentage(quotation.getLightingTaxPercentage());

        calcDto.setEditedAccessoriesTaxPercentage(request.getAccessoriesTaxPercentage());
        calcDto.setEditedCabinetsTaxPercentage(request.getCabinetsTaxPercentage());
        calcDto.setEditedDoorsTaxPercentage(request.getDoorsTaxPercentage());
        calcDto.setEditedLightingTaxPercentage(request.getLightingTaxPercentage());

        calcDto.setTransportationPrice(quotation.getTransportationPrice());
        calcDto.setInstallationPrice(quotation.getInstallationPrice());

        calculateCashValues(calcDto);

        // Update committed amounts
        project.setCommittedInHand(calcDto.getCashInHand());
        project.setCommittedInAccount(calcDto.getCashInAccount());

        CustomerProject savedProject = projectRepository.save(project);
        return ApiResponse.success("Cash calculation updated successfully", convertToDto(savedProject));
    }

    /**
     * Calculate cash in hand and cash in account based on category tax percentages
     */
    private void calculateCashValues(ProjectCashCalculationDto dto) {
        BigDecimal cashInHand = BigDecimal.ZERO;
        BigDecimal cashInAccount = BigDecimal.ZERO;

        // Process each category
        BigDecimal[] accessories = calculateCategoryCash(
                dto.getAccessoriesBaseTotal(),
                dto.getAccessoriesMarginAmount(),
                dto.getAccessoriesTaxPercentage(),
                dto.getEditedAccessoriesTaxPercentage());
        cashInHand = cashInHand.add(accessories[0]);
        cashInAccount = cashInAccount.add(accessories[1]);

        BigDecimal[] cabinets = calculateCategoryCash(
                dto.getCabinetsBaseTotal(),
                dto.getCabinetsMarginAmount(),
                dto.getCabinetsTaxPercentage(),
                dto.getEditedCabinetsTaxPercentage());
        cashInHand = cashInHand.add(cabinets[0]);
        cashInAccount = cashInAccount.add(cabinets[1]);

        BigDecimal[] doors = calculateCategoryCash(
                dto.getDoorsBaseTotal(),
                dto.getDoorsMarginAmount(),
                dto.getDoorsTaxPercentage(),
                dto.getEditedDoorsTaxPercentage());
        cashInHand = cashInHand.add(doors[0]);
        cashInAccount = cashInAccount.add(doors[1]);

        BigDecimal[] lighting = calculateCategoryCash(
                dto.getLightingBaseTotal(),
                dto.getLightingMarginAmount(),
                dto.getLightingTaxPercentage(),
                dto.getEditedLightingTaxPercentage());
        cashInHand = cashInHand.add(lighting[0]);
        cashInAccount = cashInAccount.add(lighting[1]);

        // Add transportation and installation to cash in hand
        if (dto.getTransportationPrice() != null) {
            cashInHand = cashInHand.add(dto.getTransportationPrice());
        }
        if (dto.getInstallationPrice() != null) {
            cashInHand = cashInHand.add(dto.getInstallationPrice());
        }

        dto.setCashInHand(cashInHand);
        dto.setCashInAccount(cashInAccount);
    }

    /**
     * Calculate cash values for a kitchen
     */
    private void calculateKitchenCashValues(KitchenCashCalculationDto kitchenDto) {
        BigDecimal cashInHand = BigDecimal.ZERO;
        BigDecimal cashInAccount = BigDecimal.ZERO;

        // Process each category
        BigDecimal[] accessories = calculateCategoryCash(
                kitchenDto.getAccessoriesBaseTotal(),
                kitchenDto.getAccessoriesMarginAmount(),
                kitchenDto.getAccessoriesTaxPercentage(),
                kitchenDto.getEditedAccessoriesTaxPercentage());
        cashInHand = cashInHand.add(accessories[0]);
        cashInAccount = cashInAccount.add(accessories[1]);

        BigDecimal[] cabinets = calculateCategoryCash(
                kitchenDto.getCabinetsBaseTotal(),
                kitchenDto.getCabinetsMarginAmount(),
                kitchenDto.getCabinetsTaxPercentage(),
                kitchenDto.getEditedCabinetsTaxPercentage());
        cashInHand = cashInHand.add(cabinets[0]);
        cashInAccount = cashInAccount.add(cabinets[1]);

        BigDecimal[] doors = calculateCategoryCash(
                kitchenDto.getDoorsBaseTotal(),
                kitchenDto.getDoorsMarginAmount(),
                kitchenDto.getDoorsTaxPercentage(),
                kitchenDto.getEditedDoorsTaxPercentage());
        cashInHand = cashInHand.add(doors[0]);
        cashInAccount = cashInAccount.add(doors[1]);

        BigDecimal[] lighting = calculateCategoryCash(
                kitchenDto.getLightingBaseTotal(),
                kitchenDto.getLightingMarginAmount(),
                kitchenDto.getLightingTaxPercentage(),
                kitchenDto.getEditedLightingTaxPercentage());
        cashInHand = cashInHand.add(lighting[0]);
        cashInAccount = cashInAccount.add(lighting[1]);

        kitchenDto.setCashInHand(cashInHand);
        kitchenDto.setCashInAccount(cashInAccount);
    }

    /**
     * Calculate cash in hand and cash in account for a single category
     * Returns array: [cashInHand, cashInAccount]
     */
    private BigDecimal[] calculateCategoryCash(
            BigDecimal baseAmount,
            BigDecimal marginAmount,
            BigDecimal originalTaxPercent,
            BigDecimal editedTaxPercent) {

        if (baseAmount == null || baseAmount.compareTo(BigDecimal.ZERO) == 0) {
            return new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO};
        }

        BigDecimal base = baseAmount != null ? baseAmount : BigDecimal.ZERO;
        BigDecimal margin = marginAmount != null ? marginAmount : BigDecimal.ZERO;
        BigDecimal originalTax = originalTaxPercent != null ? originalTaxPercent : BigDecimal.ZERO;
        BigDecimal editedTax = editedTaxPercent != null ? editedTaxPercent : originalTax;

        // Calculate total before tax and tax amount
        BigDecimal totalBeforeTax = base.add(margin);
        BigDecimal taxAmount = totalBeforeTax.multiply(editedTax).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal finalAmount = totalBeforeTax.add(taxAmount);

        BigDecimal categoryCashInHand = BigDecimal.ZERO;
        BigDecimal categoryCashInAccount = BigDecimal.ZERO;

        // If edited tax is half of original tax, split the category
        BigDecimal halfOfOriginal = originalTax.divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP);
        
        if (editedTax.compareTo(halfOfOriginal) == 0 && originalTax.compareTo(BigDecimal.ZERO) > 0) {
            // Split: half of (base + margin) to cash in hand, half of (base + margin) + tax to cash in account
            BigDecimal halfTotalBeforeTax = totalBeforeTax.divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP);
            categoryCashInHand = halfTotalBeforeTax;
            categoryCashInAccount = halfTotalBeforeTax.add(taxAmount);
        } else {
            // Full amount goes to cash in account
            categoryCashInAccount = finalAmount;
        }

        return new BigDecimal[]{categoryCashInHand, categoryCashInAccount};
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
        dto.setCommittedInHand(project.getCommittedInHand());
        dto.setCommittedInAccount(project.getCommittedInAccount());
        dto.setReceivedInHand(project.getReceivedInHand());
        dto.setReceivedInAccount(project.getReceivedInAccount());
        dto.setBalanceInHand(project.getBalanceInHand());
        dto.setBalanceInAccount(project.getBalanceInAccount());
        dto.setBalanceAmount(project.getBalanceAmount());
        dto.setReceivedAmountTotal(project.getReceivedAmountTotal());
        dto.setProfitAmount(project.getProfitAmount());
        dto.setTotalExpense(project.getTotalExpense());
        dto.setStatus(project.getStatus());
        dto.setStartDate(project.getStartDate());
        dto.setExpectedCompletionDate(project.getExpectedCompletionDate());
        dto.setActualCompletionDate(project.getActualCompletionDate());
        dto.setProjectDescription(project.getProjectDescription());
        dto.setCreatedBy(project.getCreatedBy());
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());

        // Category tax percentages
        dto.setAccessoriesTaxPercentage(project.getAccessoriesTaxPercentage());
        dto.setCabinetsTaxPercentage(project.getCabinetsTaxPercentage());
        dto.setDoorsTaxPercentage(project.getDoorsTaxPercentage());
        dto.setLightingTaxPercentage(project.getLightingTaxPercentage());

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