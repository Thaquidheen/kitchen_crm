package com.fleetmanagement.kitchencrmbackend.modules.architect.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectVisitCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectVisitDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.ArchitectVisit;
import com.fleetmanagement.kitchencrmbackend.modules.architect.repository.ArchitectRepository;
import com.fleetmanagement.kitchencrmbackend.modules.architect.repository.ArchitectVisitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ArchitectServiceImpl implements ArchitectService {

    @Autowired
    private ArchitectRepository architectRepository;

    @Autowired
    private ArchitectVisitRepository architectVisitRepository;

    @Override
    public ApiResponse<Page<ArchitectDto>> getAllArchitects(Pageable pageable, String visitStatus) {
        Page<Architect> architects;
        
        if (visitStatus != null && !visitStatus.isEmpty()) {
            if ("VISITED".equalsIgnoreCase(visitStatus)) {
                architects = architectRepository.findByLastVisitDateIsNotNull(pageable);
            } else if ("NOT_VISITED".equalsIgnoreCase(visitStatus)) {
                architects = architectRepository.findByLastVisitDateIsNull(pageable);
            } else {
                architects = architectRepository.findAll(pageable);
            }
        } else {
            architects = architectRepository.findAll(pageable);
        }
        
        Page<ArchitectDto> architectDtos = architects.map(this::convertToDto);
        return ApiResponse.success(architectDtos);
    }

    @Override
    public ApiResponse<List<ArchitectDto>> getAllArchitects() {
        List<Architect> architects = architectRepository.findAll();
        List<ArchitectDto> architectDtos = architects.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(architectDtos);
    }

    @Override
    public ApiResponse<ArchitectDto> getArchitectById(Long id) {
        Architect architect = architectRepository.findById(id).orElse(null);
        if (architect == null) {
            return ApiResponse.error("Architect not found");
        }
        return ApiResponse.success(convertToDto(architect));
    }

    @Override
    public ApiResponse<ArchitectDto> createArchitect(ArchitectCreateDto architectCreateDto) {
        Architect architect = new Architect();
        architect.setArchitectureName(architectCreateDto.getArchitectureName());
        architect.setFirm(architectCreateDto.getFirm());
        architect.setContactNumber(architectCreateDto.getContactNumber());
        architect.setPrincipalArchitectName(architectCreateDto.getPrincipalArchitectName());

        Architect saved = architectRepository.save(architect);
        return ApiResponse.success("Architect created successfully", convertToDto(saved));
    }

    @Override
    public ApiResponse<ArchitectDto> updateArchitect(Long id, ArchitectUpdateDto architectUpdateDto) {
        Architect architect = architectRepository.findById(id).orElse(null);
        if (architect == null) {
            return ApiResponse.error("Architect not found");
        }

        if (architectUpdateDto.getArchitectureName() != null) {
            architect.setArchitectureName(architectUpdateDto.getArchitectureName());
        }
        if (architectUpdateDto.getFirm() != null) {
            architect.setFirm(architectUpdateDto.getFirm());
        }
        if (architectUpdateDto.getContactNumber() != null) {
            architect.setContactNumber(architectUpdateDto.getContactNumber());
        }
        if (architectUpdateDto.getPrincipalArchitectName() != null) {
            architect.setPrincipalArchitectName(architectUpdateDto.getPrincipalArchitectName());
        }

        Architect updated = architectRepository.save(architect);
        return ApiResponse.success("Architect updated successfully", convertToDto(updated));
    }

    @Override
    public ApiResponse<String> deleteArchitect(Long id) {
        Architect architect = architectRepository.findById(id).orElse(null);
        if (architect == null) {
            return ApiResponse.error("Architect not found");
        }

        architectRepository.delete(architect);
        return ApiResponse.success("Architect deleted successfully");
    }

    @Override
    public ApiResponse<Page<ArchitectDto>> searchArchitects(String searchTerm, Pageable pageable) {
        // Search in both architecture name and firm
        Page<Architect> architects = architectRepository.findByArchitectureNameContainingIgnoreCase(searchTerm, pageable);
        if (architects.isEmpty()) {
            architects = architectRepository.findByFirmContainingIgnoreCase(searchTerm, pageable);
        }
        Page<ArchitectDto> architectDtos = architects.map(this::convertToDto);
        return ApiResponse.success(architectDtos);
    }

    @Override
    public ApiResponse<ArchitectVisitDto> recordVisit(ArchitectVisitCreateDto dto, String visitedBy) {
        Architect architect = architectRepository.findById(dto.getArchitectId()).orElse(null);
        if (architect == null) {
            return ApiResponse.error("Architect not found");
        }

        ArchitectVisit visit = new ArchitectVisit();
        visit.setArchitect(architect);
        visit.setVisitDate(dto.getVisitDate());
        visit.setNotes(dto.getNotes());
        visit.setVisitedBy(dto.getVisitedBy() != null ? dto.getVisitedBy() : visitedBy);

        ArchitectVisit savedVisit = architectVisitRepository.save(visit);

        // Update architect's last visit date
        architect.setLastVisitDate(dto.getVisitDate());
        architectRepository.save(architect);

        return ApiResponse.success("Visit recorded successfully", convertVisitToDto(savedVisit));
    }

    @Override
    public ApiResponse<ArchitectVisitDto> markAsVisited(Long architectId, String visitedBy) {
        Architect architect = architectRepository.findById(architectId).orElse(null);
        if (architect == null) {
            return ApiResponse.error("Architect not found");
        }

        ArchitectVisit visit = new ArchitectVisit();
        visit.setArchitect(architect);
        visit.setVisitDate(LocalDateTime.now());
        visit.setVisitedBy(visitedBy);

        ArchitectVisit savedVisit = architectVisitRepository.save(visit);

        // Update architect's last visit date
        architect.setLastVisitDate(LocalDateTime.now());
        architectRepository.save(architect);

        return ApiResponse.success("Architect marked as visited", convertVisitToDto(savedVisit));
    }

    @Override
    public ApiResponse<List<ArchitectVisitDto>> getVisitHistory(Long architectId) {
        Architect architect = architectRepository.findById(architectId).orElse(null);
        if (architect == null) {
            return ApiResponse.error("Architect not found");
        }

        List<ArchitectVisit> visits = architectVisitRepository.findByArchitectIdOrderByVisitDateDesc(architectId);
        List<ArchitectVisitDto> visitDtos = visits.stream()
                .map(this::convertVisitToDto)
                .collect(Collectors.toList());

        return ApiResponse.success(visitDtos);
    }

    private ArchitectDto convertToDto(Architect architect) {
        ArchitectDto dto = new ArchitectDto();
        dto.setId(architect.getId());
        dto.setArchitectureName(architect.getArchitectureName());
        dto.setFirm(architect.getFirm());
        dto.setContactNumber(architect.getContactNumber());
        dto.setPrincipalArchitectName(architect.getPrincipalArchitectName());
        dto.setLastVisitDate(architect.getLastVisitDate());
        
        // Calculate visit count
        Long visitCount = architectVisitRepository.countByArchitectId(architect.getId());
        dto.setVisitCount(visitCount);
        dto.setHasVisits(visitCount > 0);
        
        dto.setCreatedAt(architect.getCreatedAt());
        dto.setUpdatedAt(architect.getUpdatedAt());
        return dto;
    }

    private ArchitectVisitDto convertVisitToDto(ArchitectVisit visit) {
        ArchitectVisitDto dto = new ArchitectVisitDto();
        dto.setId(visit.getId());
        dto.setArchitectId(visit.getArchitect().getId());
        dto.setVisitDate(visit.getVisitDate());
        dto.setNotes(visit.getNotes());
        dto.setVisitedBy(visit.getVisitedBy());
        dto.setCreatedAt(visit.getCreatedAt());
        dto.setUpdatedAt(visit.getUpdatedAt());
        return dto;
    }
}




