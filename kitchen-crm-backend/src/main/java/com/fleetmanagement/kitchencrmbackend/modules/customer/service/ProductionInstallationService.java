package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionInstallation;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface ProductionInstallationService {

    ApiResponse<Page<ProductionInstallationDto>> getAllProductionInstallations(
            ProductionInstallation.InstallationStatus status,
            String projectManager,
            String teamLead,
            String customerName,
            Pageable pageable);

    ApiResponse<ProductionInstallationDto> getProductionInstallationByCustomer(Long customerId);

    ApiResponse<ProductionInstallationDto> createProductionInstallation(
            ProductionInstallationCreateDto createDto, String createdBy);

    ApiResponse<ProductionInstallationDto> updateProductionInstallation(
            Long customerId, ProductionInstallationDto dto, String updatedBy);

    ApiResponse<String> updateTaskStatus(Long customerId, TaskUpdateDto taskUpdateDto, String updatedBy);

    ApiResponse<String> recordSiteVisit(Long customerId, SiteVisitDto siteVisitDto, String updatedBy);

    ApiResponse<String> recordQualityCheck(Long customerId, QualityCheckDto qualityCheckDto, String updatedBy);

    ApiResponse<String> completeHandover(Long customerId, HandoverDto handoverDto, String updatedBy);

    ApiResponse<String> updateInstallationStatus(Long customerId,
                                                 ProductionInstallation.InstallationStatus status, String updatedBy);

    ApiResponse<List<ProductionInstallationDto>> getInstallationsByStatus(
            ProductionInstallation.InstallationStatus status);

    ApiResponse<List<ProductionInstallationDto>> getInstallationsByProjectManager(String projectManager);

    ApiResponse<List<ProductionInstallationDto>> getInstallationsByTeamLead(String teamLead);

    ApiResponse<List<ProductionInstallationDto>> getScheduledCompletions(LocalDate fromDate, LocalDate toDate);

    ApiResponse<List<ProductionInstallationDto>> getOverdueProjects();

    ApiResponse<List<ProductionInstallationDto>> getReadyForInstallation();

    ApiResponse<List<ProductionInstallationDto>> getReadyForHandover();

    ApiResponse<Map<String, Object>> getProductionInstallationStatistics();

    ApiResponse<Map<String, Object>> getInstallationProgress(Long customerId);
}