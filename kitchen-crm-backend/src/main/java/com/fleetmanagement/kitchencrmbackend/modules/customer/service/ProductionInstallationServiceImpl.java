package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionInstallation;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.WorkflowHistory;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionInstallationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.WorkflowHistoryRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductionInstallationServiceImpl implements ProductionInstallationService {

    @Autowired
    private ProductionInstallationRepository productionInstallationRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private WorkflowHistoryRepository workflowHistoryRepository;

    @Override
    public ApiResponse<Page<ProductionInstallationDto>> getAllProductionInstallations(
            ProductionInstallation.InstallationStatus status,
            String projectManager,
            String teamLead,
            String customerName,
            Pageable pageable) {

        Page<ProductionInstallation> installations = productionInstallationRepository.findByFilters(
                status, projectManager, teamLead, customerName, pageable);

        Page<ProductionInstallationDto> installationDtos = installations.map(this::convertToDto);
        return ApiResponse.success(installationDtos);
    }

    @Override
    public ApiResponse<ProductionInstallationDto> getProductionInstallationByCustomer(Long customerId) {
        ProductionInstallation installation = productionInstallationRepository.findByCustomerId(customerId).orElse(null);
        if (installation == null) {
            return ApiResponse.error("Production installation not found for customer");
        }
        return ApiResponse.success(convertToDto(installation));
    }

    @Override
    public ApiResponse<ProductionInstallationDto> createProductionInstallation(
            ProductionInstallationCreateDto createDto, String createdBy) {

        // Validate customer exists
        Customer customer = customerRepository.findById(createDto.getCustomerId()).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }

        // Check if production installation already exists for customer
        if (productionInstallationRepository.findByCustomerId(createDto.getCustomerId()).isPresent()) {
            return ApiResponse.error("Production installation already exists for this customer");
        }

        ProductionInstallation installation = new ProductionInstallation();
        installation.setCustomer(customer);
        installation.setProjectManagerAssigned(createDto.getProjectManagerAssigned());
        installation.setInstallationTeamLead(createDto.getInstallationTeamLead());
        installation.setEstimatedCompletionDate(createDto.getEstimatedCompletionDate());
        installation.setInstallationNotes(createDto.getInstallationNotes());
        installation.setOverallStatus(ProductionInstallation.InstallationStatus.NOT_STARTED);

        ProductionInstallation savedInstallation = productionInstallationRepository.save(installation);

        // Create workflow history
        createWorkflowHistory(customer, "Production Installation Created", "NOT_STARTED",
                createdBy, "Production installation phase initiated");

        return ApiResponse.success("Production installation created successfully", convertToDto(savedInstallation));
    }

    @Override
    public ApiResponse<ProductionInstallationDto> updateProductionInstallation(
            Long customerId, ProductionInstallationDto dto, String updatedBy) {

        ProductionInstallation existingInstallation = productionInstallationRepository
                .findByCustomerId(customerId).orElse(null);
        if (existingInstallation == null) {
            return ApiResponse.error("Production installation not found for customer");
        }

        // Update installation details
        updateInstallationFromDto(existingInstallation, dto);

        ProductionInstallation updatedInstallation = productionInstallationRepository.save(existingInstallation);

        // Auto-update status based on progress
        autoUpdateStatus(updatedInstallation, updatedBy);

        // Create workflow history
        createWorkflowHistory(existingInstallation.getCustomer(), "Production Installation Updated",
                existingInstallation.getOverallStatus().name(), updatedBy,
                "Production installation details updated");

        return ApiResponse.success("Production installation updated successfully", convertToDto(updatedInstallation));
    }

    @Override
    public ApiResponse<String> updateTaskStatus(Long customerId, TaskUpdateDto taskUpdateDto, String updatedBy) {
        ProductionInstallation installation = productionInstallationRepository.findByCustomerId(customerId).orElse(null);
        if (installation == null) {
            return ApiResponse.error("Production installation not found for customer");
        }

        // Update specific task based on task name
        boolean taskUpdated = updateSpecificTask(installation, taskUpdateDto);

        if (!taskUpdated) {
            return ApiResponse.error("Invalid task name: " + taskUpdateDto.getTaskName());
        }

        productionInstallationRepository.save(installation);

        // Auto-update overall status
        autoUpdateStatus(installation, updatedBy);

        // Create workflow history
        createWorkflowHistory(installation.getCustomer(), "Task Updated",
                installation.getOverallStatus().name(), updatedBy,
                "Task '" + taskUpdateDto.getTaskName() + "' marked as " +
                        (taskUpdateDto.getCompleted() ? "completed" : "pending"));

        return ApiResponse.success("Task status updated successfully");
    }

    @Override
    public ApiResponse<String> recordSiteVisit(Long customerId, SiteVisitDto siteVisitDto, String updatedBy) {
        ProductionInstallation installation = productionInstallationRepository.findByCustomerId(customerId).orElse(null);
        if (installation == null) {
            return ApiResponse.error("Production installation not found for customer");
        }

        installation.setSiteVisitMarking(true);
        installation.setSiteVisitDate(siteVisitDto.getVisitDate());
        installation.setSiteMeasurementsVerified(siteVisitDto.getMeasurementsVerified());

        String notes = installation.getInstallationNotes() != null ? installation.getInstallationNotes() : "";
        notes += "\nSite Visit (" + siteVisitDto.getVisitDate() + "): " + siteVisitDto.getVisitNotes();
        installation.setInstallationNotes(notes);

        productionInstallationRepository.save(installation);

        // Auto-update status
        autoUpdateStatus(installation, updatedBy);

        // Create workflow history
        createWorkflowHistory(installation.getCustomer(), "Site Visit Recorded",
                installation.getOverallStatus().name(), updatedBy,
                "Site visit completed by " + siteVisitDto.getVisitedBy());

        return ApiResponse.success("Site visit recorded successfully");
    }

    @Override
    public ApiResponse<String> recordQualityCheck(Long customerId, QualityCheckDto qualityCheckDto, String updatedBy) {
        ProductionInstallation installation = productionInstallationRepository.findByCustomerId(customerId).orElse(null);
        if (installation == null) {
            return ApiResponse.error("Production installation not found for customer");
        }

        installation.setQualityCheckPassed(qualityCheckDto.getPassed());
        installation.setQualityCheckDate(qualityCheckDto.getCheckDate());
        installation.setQualityCheckNotes(qualityCheckDto.getCheckNotes());

        productionInstallationRepository.save(installation);

        // Auto-update status
        autoUpdateStatus(installation, updatedBy);

        // Create workflow history
        String result = qualityCheckDto.getPassed() ? "passed" : "failed";
        createWorkflowHistory(installation.getCustomer(), "Quality Check Completed",
                installation.getOverallStatus().name(), updatedBy,
                "Quality check " + result + " by " + qualityCheckDto.getCheckedBy());

        return ApiResponse.success("Quality check recorded successfully");
    }

    @Override
    public ApiResponse<String> completeHandover(Long customerId, HandoverDto handoverDto, String updatedBy) {
        ProductionInstallation installation = productionInstallationRepository.findByCustomerId(customerId).orElse(null);
        if (installation == null) {
            return ApiResponse.error("Production installation not found for customer");
        }

        if (!Boolean.TRUE.equals(installation.getQualityCheckPassed())) {
            return ApiResponse.error("Quality check must pass before handover");
        }

        installation.setHandoverToClient(true);
        installation.setHandoverDate(handoverDto.getHandoverDate());
        installation.setClientFeedbackPhotography(handoverDto.getClientFeedbackPhotography());
        installation.setWarrantyProvided(handoverDto.getWarrantyProvided());
        installation.setWarrantyDocumentPath(handoverDto.getWarrantyDocumentPath());
        installation.setActualCompletionDate(handoverDto.getHandoverDate());
        installation.setOverallStatus(ProductionInstallation.InstallationStatus.COMPLETED);

        productionInstallationRepository.save(installation);

        // Create workflow history
        createWorkflowHistory(installation.getCustomer(), "Project Handover Completed", "COMPLETED",
                updatedBy, "Project successfully handed over to client");

        return ApiResponse.success("Project handover completed successfully");
    }

    @Override
    public ApiResponse<String> updateInstallationStatus(Long customerId,
                                                        ProductionInstallation.InstallationStatus status, String updatedBy) {

        ProductionInstallation installation = productionInstallationRepository.findByCustomerId(customerId).orElse(null);
        if (installation == null) {
            return ApiResponse.error("Production installation not found for customer");
        }

        ProductionInstallation.InstallationStatus previousStatus = installation.getOverallStatus();
        installation.setOverallStatus(status);

        productionInstallationRepository.save(installation);

        // Create workflow history
        createWorkflowHistory(installation.getCustomer(), "Installation Status Updated", status.name(),
                updatedBy, "Status changed from " + previousStatus + " to " + status);

        return ApiResponse.success("Installation status updated successfully");
    }

    @Override
    public ApiResponse<List<ProductionInstallationDto>> getInstallationsByStatus(
            ProductionInstallation.InstallationStatus status) {

        List<ProductionInstallation> installations = productionInstallationRepository.findByOverallStatus(status);
        List<ProductionInstallationDto> installationDtos = installations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(installationDtos);
    }

    @Override
    public ApiResponse<List<ProductionInstallationDto>> getInstallationsByProjectManager(String projectManager) {
        List<ProductionInstallation> installations = productionInstallationRepository
                .findByProjectManagerAssigned(projectManager);
        List<ProductionInstallationDto> installationDtos = installations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(installationDtos);
    }

    @Override
    public ApiResponse<List<ProductionInstallationDto>> getInstallationsByTeamLead(String teamLead) {
        List<ProductionInstallation> installations = productionInstallationRepository
                .findByInstallationTeamLead(teamLead);
        List<ProductionInstallationDto> installationDtos = installations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(installationDtos);
    }

    @Override
    public ApiResponse<List<ProductionInstallationDto>> getScheduledCompletions(LocalDate fromDate, LocalDate toDate) {
        List<ProductionInstallation> installations = productionInstallationRepository
                .findByEstimatedCompletionDateBetween(fromDate, toDate);
        List<ProductionInstallationDto> installationDtos = installations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(installationDtos);
    }

    @Override
    public ApiResponse<List<ProductionInstallationDto>> getOverdueProjects() {
        List<ProductionInstallation> installations = productionInstallationRepository
                .findOverdueProjects(LocalDate.now());
        List<ProductionInstallationDto> installationDtos = installations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(installationDtos);
    }

    @Override
    public ApiResponse<List<ProductionInstallationDto>> getReadyForInstallation() {
        List<ProductionInstallation> installations = productionInstallationRepository.findReadyForInstallation();
        List<ProductionInstallationDto> installationDtos = installations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(installationDtos);
    }

    @Override
    public ApiResponse<List<ProductionInstallationDto>> getReadyForHandover() {
        List<ProductionInstallation> installations = productionInstallationRepository.findReadyForHandover();
        List<ProductionInstallationDto> installationDtos = installations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(installationDtos);
    }

    @Override
    public ApiResponse<Map<String, Object>> getProductionInstallationStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Installation counts by status
        for (ProductionInstallation.InstallationStatus status : ProductionInstallation.InstallationStatus.values()) {
            Long count = productionInstallationRepository.countByOverallStatus(status);
            stats.put(status.name().toLowerCase() + "_installations", count);
        }

        // Total installations
        stats.put("total_installations", productionInstallationRepository.count());

        // Ready for actions
        stats.put("ready_for_production", productionInstallationRepository.findReadyForProduction().size());
        stats.put("ready_for_installation", productionInstallationRepository.findReadyForInstallation().size());
        stats.put("ready_for_handover", productionInstallationRepository.findReadyForHandover().size());

        // Overdue projects
        stats.put("overdue_projects", productionInstallationRepository.findOverdueProjects(LocalDate.now()).size());

        // This week's scheduled completions
        LocalDate startOfWeek = LocalDate.now().with(java.time.DayOfWeek.MONDAY);
        LocalDate endOfWeek = startOfWeek.plusDays(6);
        stats.put("this_week_completions",
                productionInstallationRepository.findByEstimatedCompletionDateBetween(startOfWeek, endOfWeek).size());

        return ApiResponse.success(stats);
    }

    @Override
    public ApiResponse<Map<String, Object>> getInstallationProgress(Long customerId) {
        ProductionInstallation installation = productionInstallationRepository.findByCustomerId(customerId).orElse(null);
        if (installation == null) {
            return ApiResponse.error("Production installation not found for customer");
        }

        Map<String, Object> progress = new HashMap<>();

        progress.put("customer_id", customerId);
        progress.put("customer_name", installation.getCustomer().getName());
        progress.put("overall_status", installation.getOverallStatus());
        progress.put("current_phase", installation.getCurrentPhase());
        progress.put("progress_percentage", installation.getOverallProgressPercentage());
        progress.put("ready_for_installation", installation.isReadyForInstallation());

        // Phase-wise progress
        Map<String, Object> phases = new HashMap<>();
        phases.put("production", getProductionPhaseProgress(installation));
        phases.put("site_preparation", getSitePreparationProgress(installation));
        phases.put("delivery", getDeliveryProgress(installation));
        phases.put("installation", getInstallationPhaseProgress(installation));
        phases.put("completion", getCompletionProgress(installation));

        progress.put("phases", phases);

        // Timeline
        progress.put("estimated_completion", installation.getEstimatedCompletionDate());
        progress.put("actual_completion", installation.getActualCompletionDate());

        return ApiResponse.success(progress);
    }

    // Helper methods
    private void updateInstallationFromDto(ProductionInstallation installation, ProductionInstallationDto dto) {
        // Production Phase
        installation.setEpdReceived(dto.getEpdReceived());
        installation.setEpdReceivedDate(dto.getEpdReceivedDate());
        installation.setProductionStarted(dto.getProductionStarted());
        installation.setProductionStartDate(dto.getProductionStartDate());
        installation.setEstimatedProductionCompletion(dto.getEstimatedProductionCompletion());
        installation.setActualProductionCompletion(dto.getActualProductionCompletion());

        // Site Preparation
        installation.setSiteVisitMarking(dto.getSiteVisitMarking());
        installation.setSiteVisitDate(dto.getSiteVisitDate());
        installation.setSiteMeasurementsVerified(dto.getSiteMeasurementsVerified());
        installation.setFlooringCompleted(dto.getFlooringCompleted());
        installation.setFlooringCompletionDate(dto.getFlooringCompletionDate());
        installation.setCeilingCompleted(dto.getCeilingCompleted());
        installation.setCeilingCompletionDate(dto.getCeilingCompletionDate());
        installation.setElectricalWorkCompleted(dto.getElectricalWorkCompleted());
        installation.setPlumbingWorkCompleted(dto.getPlumbingWorkCompleted());

        // Delivery Tracking
        installation.setCarcassAtSite(dto.getCarcassAtSite());
        installation.setCarcassDeliveryDate(dto.getCarcassDeliveryDate());
        installation.setCountertopAtSite(dto.getCountertopAtSite());
        installation.setCountertopDeliveryDate(dto.getCountertopDeliveryDate());
        installation.setShuttersAtSite(dto.getShuttersAtSite());
        installation.setShuttersDeliveryDate(dto.getShuttersDeliveryDate());
        installation.setAccessoriesAtSite(dto.getAccessoriesAtSite());
        installation.setAccessoriesDeliveryDate(dto.getAccessoriesDeliveryDate());

        // Installation Phase
        installation.setCarcassInstalled(dto.getCarcassInstalled());
        installation.setCarcassInstallationDate(dto.getCarcassInstallationDate());
        installation.setCountertopInstalled(dto.getCountertopInstalled());
        installation.setCountertopInstallationDate(dto.getCountertopInstallationDate());
        installation.setShuttersInstalled(dto.getShuttersInstalled());
        installation.setShuttersInstallationDate(dto.getShuttersInstallationDate());
        installation.setAccessoriesInstalled(dto.getAccessoriesInstalled());
        installation.setAccessoriesInstallationDate(dto.getAccessoriesInstallationDate());

        // Appliances & Final Setup
        installation.setAppliancesReceived(dto.getAppliancesReceived());
        installation.setAppliancesReceivedDate(dto.getAppliancesReceivedDate());
        installation.setAppliancesInstalled(dto.getAppliancesInstalled());
        installation.setAppliancesInstallationDate(dto.getAppliancesInstallationDate());
        installation.setLightsInstalled(dto.getLightsInstalled());
        installation.setLightsInstallationDate(dto.getLightsInstallationDate());
        installation.setFinalCleaningDone(dto.getFinalCleaningDone());
        installation.setFinalCleaningDate(dto.getFinalCleaningDate());

        // Project Details
        installation.setProjectManagerAssigned(dto.getProjectManagerAssigned());
        installation.setInstallationTeamLead(dto.getInstallationTeamLead());
        installation.setEstimatedCompletionDate(dto.getEstimatedCompletionDate());
        installation.setInstallationNotes(dto.getInstallationNotes());
    }

    private boolean updateSpecificTask(ProductionInstallation installation, TaskUpdateDto taskUpdate) {
        String taskName = taskUpdate.getTaskName().toLowerCase().replace(" ", "_");
        LocalDate completionDate = taskUpdate.getCompleted() ?
                (taskUpdate.getCompletionDate() != null ? taskUpdate.getCompletionDate() : LocalDate.now()) : null;

        switch (taskName) {
            case "epd_received":
                installation.setEpdReceived(taskUpdate.getCompleted());
                installation.setEpdReceivedDate(completionDate);
                return true;
            case "production_started":
                installation.setProductionStarted(taskUpdate.getCompleted());
                installation.setProductionStartDate(completionDate);
                return true;
            case "site_visit_marking":
                installation.setSiteVisitMarking(taskUpdate.getCompleted());
                installation.setSiteVisitDate(completionDate);
                return true;
            case "flooring_completed":
                installation.setFlooringCompleted(taskUpdate.getCompleted());
                installation.setFlooringCompletionDate(completionDate);
                return true;
            case "ceiling_completed":
                installation.setCeilingCompleted(taskUpdate.getCompleted());
                installation.setCeilingCompletionDate(completionDate);
                return true;
            case "carcass_at_site":
                installation.setCarcassAtSite(taskUpdate.getCompleted());
                installation.setCarcassDeliveryDate(completionDate);
                return true;
            case "countertop_at_site":
                installation.setCountertopAtSite(taskUpdate.getCompleted());
                installation.setCountertopDeliveryDate(completionDate);
                return true;
            case "shutters_at_site":
                installation.setShuttersAtSite(taskUpdate.getCompleted());
                installation.setShuttersDeliveryDate(completionDate);
                return true;
            case "carcass_installed":
                installation.setCarcassInstalled(taskUpdate.getCompleted());
                installation.setCarcassInstallationDate(completionDate);
                return true;
            case "countertop_installed":
                installation.setCountertopInstalled(taskUpdate.getCompleted());
                installation.setCountertopInstallationDate(completionDate);
                return true;
            case "shutters_installed":
                installation.setShuttersInstalled(taskUpdate.getCompleted());
                installation.setShuttersInstallationDate(completionDate);
                return true;
            case "appliances_installed":
                installation.setAppliancesInstalled(taskUpdate.getCompleted());
                installation.setAppliancesInstallationDate(completionDate);
                return true;
            case "lights_installed":
                installation.setLightsInstalled(taskUpdate.getCompleted());
                installation.setLightsInstallationDate(completionDate);
                return true;
            case "final_cleaning_done":
                installation.setFinalCleaningDone(taskUpdate.getCompleted());
                installation.setFinalCleaningDate(completionDate);
                return true;
            default:
                return false;
        }
    }

    private void autoUpdateStatus(ProductionInstallation installation, String updatedBy) {
        ProductionInstallation.InstallationStatus newStatus = determineStatusBasedOnProgress(installation);

        if (newStatus != installation.getOverallStatus()) {
            ProductionInstallation.InstallationStatus oldStatus = installation.getOverallStatus();
            installation.setOverallStatus(newStatus);
            productionInstallationRepository.save(installation);

            // Create workflow history for auto status update
            createWorkflowHistory(installation.getCustomer(), "Status Auto-Updated", newStatus.name(),
                    updatedBy, "Status automatically updated from " + oldStatus + " to " + newStatus);
        }
    }

    private ProductionInstallation.InstallationStatus determineStatusBasedOnProgress(ProductionInstallation installation) {
        if (Boolean.TRUE.equals(installation.getHandoverToClient())) {
            return ProductionInstallation.InstallationStatus.COMPLETED;
        } else if (Boolean.TRUE.equals(installation.getQualityCheckPassed())) {
            return ProductionInstallation.InstallationStatus.QUALITY_CHECK;
        } else if (Boolean.TRUE.equals(installation.getCarcassInstalled()) ||
                Boolean.TRUE.equals(installation.getCountertopInstalled()) ||
                Boolean.TRUE.equals(installation.getShuttersInstalled())) {
            return ProductionInstallation.InstallationStatus.INSTALLATION;
        } else if (Boolean.TRUE.equals(installation.getCarcassAtSite()) ||
                Boolean.TRUE.equals(installation.getCountertopAtSite()) ||
                Boolean.TRUE.equals(installation.getShuttersAtSite())) {
            return ProductionInstallation.InstallationStatus.DELIVERY;
        } else if (Boolean.TRUE.equals(installation.getSiteVisitMarking()) ||
                Boolean.TRUE.equals(installation.getFlooringCompleted())) {
            return ProductionInstallation.InstallationStatus.SITE_PREPARATION;
        } else if (Boolean.TRUE.equals(installation.getEpdReceived()) ||
                Boolean.TRUE.equals(installation.getProductionStarted())) {
            return ProductionInstallation.InstallationStatus.PRODUCTION;
        } else {
            return ProductionInstallation.InstallationStatus.NOT_STARTED;
        }
    }

    private Map<String, Object> getProductionPhaseProgress(ProductionInstallation installation) {
        Map<String, Object> progress = new HashMap<>();
        int completed = 0;
        int total = 2;

        if (Boolean.TRUE.equals(installation.getEpdReceived())) completed++;
        if (Boolean.TRUE.equals(installation.getProductionStarted())) completed++;

        progress.put("completed_tasks", completed);
        progress.put("total_tasks", total);
        progress.put("percentage", (completed * 100) / total);

        return progress;
    }

    private Map<String, Object> getSitePreparationProgress(ProductionInstallation installation) {
        Map<String, Object> progress = new HashMap<>();
        int completed = 0;
        int total = 5;

        if (Boolean.TRUE.equals(installation.getSiteVisitMarking())) completed++;
        if (Boolean.TRUE.equals(installation.getSiteMeasurementsVerified())) completed++;
        if (Boolean.TRUE.equals(installation.getFlooringCompleted())) completed++;
        if (Boolean.TRUE.equals(installation.getCeilingCompleted())) completed++;
        if (Boolean.TRUE.equals(installation.getElectricalWorkCompleted())) completed++;

        progress.put("completed_tasks", completed);
        progress.put("total_tasks", total);
        progress.put("percentage", (completed * 100) / total);

        return progress;
    }

    private Map<String, Object> getDeliveryProgress(ProductionInstallation installation) {
        Map<String, Object> progress = new HashMap<>();
        int completed = 0;
        int total = 4;

        if (Boolean.TRUE.equals(installation.getCarcassAtSite())) completed++;
        if (Boolean.TRUE.equals(installation.getCountertopAtSite())) completed++;
        if (Boolean.TRUE.equals(installation.getShuttersAtSite())) completed++;
        if (Boolean.TRUE.equals(installation.getAccessoriesAtSite())) completed++;

        progress.put("completed_tasks", completed);
        progress.put("total_tasks", total);
        progress.put("percentage", (completed * 100) / total);

        return progress;
    }

    private Map<String, Object> getInstallationPhaseProgress(ProductionInstallation installation) {
        Map<String, Object> progress = new HashMap<>();
        int completed = 0;
        int total = 6;

        if (Boolean.TRUE.equals(installation.getCarcassInstalled())) completed++;
        if (Boolean.TRUE.equals(installation.getCountertopInstalled())) completed++;
        if (Boolean.TRUE.equals(installation.getShuttersInstalled())) completed++;
        if (Boolean.TRUE.equals(installation.getAccessoriesInstalled())) completed++;
        if (Boolean.TRUE.equals(installation.getAppliancesInstalled())) completed++;
        if (Boolean.TRUE.equals(installation.getLightsInstalled())) completed++;

        progress.put("completed_tasks", completed);
        progress.put("total_tasks", total);
        progress.put("percentage", (completed * 100) / total);

        return progress;
    }

    private Map<String, Object> getCompletionProgress(ProductionInstallation installation) {
        Map<String, Object> progress = new HashMap<>();
        int completed = 0;
        int total = 3;

        if (Boolean.TRUE.equals(installation.getFinalCleaningDone())) completed++;
        if (Boolean.TRUE.equals(installation.getQualityCheckPassed())) completed++;
        if (Boolean.TRUE.equals(installation.getHandoverToClient())) completed++;

        progress.put("completed_tasks", completed);
        progress.put("total_tasks", total);
        progress.put("percentage", (completed * 100) / total);

        return progress;
    }

    private void createWorkflowHistory(Customer customer, String previousState, String newState,
                                       String changedBy, String reason) {
        WorkflowHistory history = new WorkflowHistory();
        history.setCustomer(customer);
        history.setPreviousState(previousState);
        history.setNewState(newState);
        history.setChangedBy(changedBy);
        history.setChangeReason(reason);
        history.setTimestamp(LocalDateTime.now());
        workflowHistoryRepository.save(history);
    }

    private ProductionInstallationDto convertToDto(ProductionInstallation installation) {
        ProductionInstallationDto dto = new ProductionInstallationDto();
        dto.setId(installation.getId());
        dto.setCustomerId(installation.getCustomer().getId());
        dto.setCustomerName(installation.getCustomer().getName());
        // Production Phase
        dto.setEpdReceived(installation.getEpdReceived());
        dto.setEpdReceivedDate(installation.getEpdReceivedDate());
        dto.setProductionStarted(installation.getProductionStarted());
        dto.setProductionStartDate(installation.getProductionStartDate());
        dto.setEstimatedProductionCompletion(installation.getEstimatedProductionCompletion());
        dto.setActualProductionCompletion(installation.getActualProductionCompletion());

        // Site Preparation
        dto.setSiteVisitMarking(installation.getSiteVisitMarking());
        dto.setSiteVisitDate(installation.getSiteVisitDate());
        dto.setSiteMeasurementsVerified(installation.getSiteMeasurementsVerified());
        dto.setFlooringCompleted(installation.getFlooringCompleted());
        dto.setFlooringCompletionDate(installation.getFlooringCompletionDate());
        dto.setCeilingCompleted(installation.getCeilingCompleted());
        dto.setCeilingCompletionDate(installation.getCeilingCompletionDate());
        dto.setElectricalWorkCompleted(installation.getElectricalWorkCompleted());
        dto.setPlumbingWorkCompleted(installation.getPlumbingWorkCompleted());

        // Delivery Tracking
        dto.setCarcassAtSite(installation.getCarcassAtSite());
        dto.setCarcassDeliveryDate(installation.getCarcassDeliveryDate());
        dto.setCountertopAtSite(installation.getCountertopAtSite());
        dto.setCountertopDeliveryDate(installation.getCountertopDeliveryDate());
        dto.setShuttersAtSite(installation.getShuttersAtSite());
        dto.setShuttersDeliveryDate(installation.getShuttersDeliveryDate());
        dto.setAccessoriesAtSite(installation.getAccessoriesAtSite());
        dto.setAccessoriesDeliveryDate(installation.getAccessoriesDeliveryDate());

        // Installation Phase
        dto.setCarcassInstalled(installation.getCarcassInstalled());
        dto.setCarcassInstallationDate(installation.getCarcassInstallationDate());
        dto.setCountertopInstalled(installation.getCountertopInstalled());
        dto.setCountertopInstallationDate(installation.getCountertopInstallationDate());
        dto.setShuttersInstalled(installation.getShuttersInstalled());
        dto.setShuttersInstallationDate(installation.getShuttersInstallationDate());
        dto.setAccessoriesInstalled(installation.getAccessoriesInstalled());
        dto.setAccessoriesInstallationDate(installation.getAccessoriesInstallationDate());

        // Appliances & Final Setup
        dto.setAppliancesReceived(installation.getAppliancesReceived());
        dto.setAppliancesReceivedDate(installation.getAppliancesReceivedDate());
        dto.setAppliancesInstalled(installation.getAppliancesInstalled());
        dto.setAppliancesInstallationDate(installation.getAppliancesInstallationDate());
        dto.setLightsInstalled(installation.getLightsInstalled());
        dto.setLightsInstallationDate(installation.getLightsInstallationDate());
        dto.setFinalCleaningDone(installation.getFinalCleaningDone());
        dto.setFinalCleaningDate(installation.getFinalCleaningDate());

        // Project Completion
        dto.setHandoverToClient(installation.getHandoverToClient());
        dto.setHandoverDate(installation.getHandoverDate());
        dto.setClientFeedbackPhotography(installation.getClientFeedbackPhotography());
        dto.setWarrantyProvided(installation.getWarrantyProvided());
        dto.setWarrantyDocumentPath(installation.getWarrantyDocumentPath());

        // Project Status and Team
        dto.setOverallStatus(installation.getOverallStatus());
        dto.setProjectManagerAssigned(installation.getProjectManagerAssigned());
        dto.setInstallationTeamLead(installation.getInstallationTeamLead());
        dto.setEstimatedCompletionDate(installation.getEstimatedCompletionDate());
        dto.setActualCompletionDate(installation.getActualCompletionDate());
        dto.setInstallationNotes(installation.getInstallationNotes());

        // Quality Control
        dto.setQualityCheckPassed(installation.getQualityCheckPassed());
        dto.setQualityCheckDate(installation.getQualityCheckDate());
        dto.setQualityCheckNotes(installation.getQualityCheckNotes());

        // Calculated Fields
        dto.setOverallProgressPercentage(installation.getOverallProgressPercentage());
        dto.setCurrentPhase(installation.getCurrentPhase());
        dto.setReadyForInstallation(installation.isReadyForInstallation());

        dto.setCreatedAt(installation.getCreatedAt());
        dto.setUpdatedAt(installation.getUpdatedAt());

        return dto;
    }
}