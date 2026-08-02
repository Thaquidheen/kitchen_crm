package com.fleetmanagement.kitchencrmbackend.modules.architect.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectVisitCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectVisitDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ArchitectService {

    /**
     * Get architects with pagination, optionally filtered by partner type and visit status
     */
    ApiResponse<Page<ArchitectDto>> getAllArchitects(Pageable pageable, String visitStatus,
                                                     Architect.PartnerType partnerType);

    /**
     * Get all architects (without pagination), optionally filtered by partner type
     */
    ApiResponse<List<ArchitectDto>> getAllArchitects(Architect.PartnerType partnerType);

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
     * Search architects across name, firm, principal and contact number
     */
    ApiResponse<Page<ArchitectDto>> searchArchitects(String searchTerm, Pageable pageable,
                                                     Architect.PartnerType partnerType);

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




