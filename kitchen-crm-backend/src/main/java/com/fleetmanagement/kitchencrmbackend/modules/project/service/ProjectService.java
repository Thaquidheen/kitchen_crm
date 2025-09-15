package com.fleetmanagement.kitchencrmbackend.modules.project.service;

import com.fleetmanagement.kitchencrmbackend.modules.project.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface ProjectService {

    ApiResponse<Page<ProjectSummaryDto>> getAllProjects(Long customerId,
                                                        CustomerProject.ProjectStatus status,
                                                        String projectName,
                                                        LocalDate fromDate,
                                                        LocalDate toDate,
                                                        Pageable pageable);

    ApiResponse<ProjectDto> getProjectById(Long id);

    ApiResponse<List<ProjectSummaryDto>> getProjectsByCustomer(Long customerId);

    ApiResponse<ProjectDto> createProject(ProjectCreateDto projectCreateDto, String createdBy);

    ApiResponse<ProjectDto> updateProject(Long id, ProjectDto projectDto, String updatedBy);

    ApiResponse<String> deleteProject(Long id);

    ApiResponse<ProjectDto> convertQuotationToProject(Long quotationId, String createdBy);

    ApiResponse<String> updateProjectStatus(Long id, CustomerProject.ProjectStatus status, String updatedBy);

    ApiResponse<Map<String, Object>> getProjectStatistics();

    ApiResponse<Map<String, Object>> getProjectFinancialSummary(Long projectId);
}