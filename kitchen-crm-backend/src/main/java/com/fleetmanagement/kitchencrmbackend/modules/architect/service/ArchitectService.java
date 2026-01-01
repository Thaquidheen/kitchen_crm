package com.fleetmanagement.kitchencrmbackend.modules.architect.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectVisitCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectVisitDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ArchitectService {

    /**
     * Get all architects with pagination
     */
    ApiResponse<Page<ArchitectDto>> getAllArchitects(Pageable pageable, String visitStatus);

    /**
     * Get all architects (without pagination)
     */
    ApiResponse<List<ArchitectDto>> getAllArchitects();

    /**
     * Get architect by ID
     */
    ApiResponse<ArchitectDto> getArchitectById(Long id);

    /**
     * Create new architect
     */
    ApiResponse<ArchitectDto> createArchitect(ArchitectCreateDto architectCreateDto);

    /**
     * Update existing architect
     */
    ApiResponse<ArchitectDto> updateArchitect(Long id, ArchitectUpdateDto architectUpdateDto);

    /**
     * Delete architect
     */
    ApiResponse<String> deleteArchitect(Long id);

    /**
     * Search architects by name or firm
     */
    ApiResponse<Page<ArchitectDto>> searchArchitects(String searchTerm, Pageable pageable);

    /**
     * Record a visit to an architect
     */
    ApiResponse<ArchitectVisitDto> recordVisit(ArchitectVisitCreateDto dto, String visitedBy);

    /**
     * Quick mark architect as visited (uses current date)
     */
    ApiResponse<ArchitectVisitDto> markAsVisited(Long architectId, String visitedBy);

    /**
     * Get visit history for an architect
     */
    ApiResponse<List<ArchitectVisitDto>> getVisitHistory(Long architectId);
}




