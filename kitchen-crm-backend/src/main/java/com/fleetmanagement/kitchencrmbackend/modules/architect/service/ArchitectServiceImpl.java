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
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectNoteDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.ArchitectNote;
import com.fleetmanagement.kitchencrmbackend.modules.architect.repository.ArchitectNoteRepository;
import com.fleetmanagement.kitchencrmbackend.modules.architect.repository.ArchitectVisitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ArchitectServiceImpl implements ArchitectService {

    @Autowired
    private ArchitectRepository architectRepository;

    @Autowired
    private ArchitectVisitRepository architectVisitRepository;

    @Autowired
    private ArchitectNoteRepository architectNoteRepository;

    @Override
    public ApiResponse<Page<ArchitectDto>> getAllArchitects(Pageable pageable, String visitStatus,
                                                            Boolean highlightedOnly, String search,
                                                            Architect.PartnerType partnerType) {
        // highlightedOnly TRUE -> only starred; null/false -> all rows.
        Boolean highlighted = Boolean.TRUE.equals(highlightedOnly) ? Boolean.TRUE : null;
        // Search runs server-side across name/firm/principal/contact so it spans the whole table,
        // not just the current page (the old client-side filter only saw the 10 loaded rows).
        String term = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<Architect> architects = architectRepository.findByFilters(
                partnerType, visitedFlag(visitStatus), highlighted, term, pageable);
        return ApiResponse.success(architects.map(this::convertToDto));
    }

    @Override
    public ApiResponse<List<ArchitectDto>> getAllArchitects(Architect.PartnerType partnerType) {
        List<ArchitectDto> architectDtos = architectRepository.findAllByPartnerType(partnerType)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(architectDtos);
    }

    /** VISITED / NOT_VISITED / anything else -> TRUE / FALSE / null (no filter). */
    private Boolean visitedFlag(String visitStatus) {
        if (visitStatus == null || visitStatus.isBlank()) return null;
        if ("VISITED".equalsIgnoreCase(visitStatus)) return Boolean.TRUE;
        if ("NOT_VISITED".equalsIgnoreCase(visitStatus)) return Boolean.FALSE;
        return null;
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
        String name = architectCreateDto.getArchitectureName().trim();
        Architect.PartnerType type = architectCreateDto.getPartnerType() != null
                ? architectCreateDto.getPartnerType()
                : Architect.PartnerType.ARCHITECT;

        // Soft dedupe. The customer form's picker creates records inline from a typed name, and
        // there is no unique constraint on this table, so without this the same architect would
        // silently accumulate duplicate rows. Returning the existing record (rather than an
        // error) is what the picker needs: the user typed a name, they get that record linked.
        Architect existing = architectRepository
                .findFirstByPartnerTypeAndArchitectureNameIgnoreCase(type, name)
                .orElse(null);
        if (existing != null) {
            return ApiResponse.success(labelFor(type) + " already exists", convertToDto(existing));
        }

        Architect architect = new Architect();
        architect.setArchitectureName(name);
        architect.setPartnerType(type);
        architect.setFirm(architectCreateDto.getFirm());
        architect.setContactNumber(architectCreateDto.getContactNumber());
        architect.setPrincipalArchitectName(architectCreateDto.getPrincipalArchitectName());
        architect.setEmail(architectCreateDto.getEmail());
        architect.setLocation(architectCreateDto.getLocation());
        architect.setHighlighted(Boolean.TRUE.equals(architectCreateDto.getHighlighted()));

        Architect saved = architectRepository.save(architect);
        return ApiResponse.success(labelFor(type) + " created successfully", convertToDto(saved));
    }

    private String labelFor(Architect.PartnerType type) {
        return type == Architect.PartnerType.BUILDER ? "Builder" : "Architect";
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
        if (architectUpdateDto.getPartnerType() != null) {
            architect.setPartnerType(architectUpdateDto.getPartnerType());
        }
        if (architectUpdateDto.getEmail() != null) {
            architect.setEmail(architectUpdateDto.getEmail());
        }
        if (architectUpdateDto.getLocation() != null) {
            architect.setLocation(architectUpdateDto.getLocation());
        }
        if (architectUpdateDto.getHighlighted() != null) {
            architect.setHighlighted(architectUpdateDto.getHighlighted());
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
    public ApiResponse<Page<ArchitectDto>> searchArchitects(String searchTerm, Pageable pageable,
                                                            Architect.PartnerType partnerType) {
        // A blank term means "no search filter" rather than an error — the picker mounts with an
        // empty box, and this endpoint used to reject that outright.
        String term = (searchTerm != null && !searchTerm.isBlank()) ? searchTerm.trim() : null;
        Page<Architect> architects = architectRepository.findByFilters(partnerType, null, null, term, pageable);
        return ApiResponse.success(architects.map(this::convertToDto));
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

        // Flush so the derived last-visit lookup below sees this row. Recomputing (rather than
        // stamping dto.getVisitDate()) means a backdated visit can no longer move "Last Visit"
        // backwards past a newer one.
        ArchitectVisit savedVisit = architectVisitRepository.saveAndFlush(visit);
        syncLastVisitDate(architect);

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

        ArchitectVisit savedVisit = architectVisitRepository.saveAndFlush(visit);
        syncLastVisitDate(architect);

        return ApiResponse.success("Architect marked as visited", convertVisitToDto(savedVisit));
    }

    @Override
    public ApiResponse<String> deleteVisit(Long architectId, Long visitId) {
        Architect architect = architectRepository.findById(architectId).orElse(null);
        if (architect == null) {
            return ApiResponse.error("Architect not found");
        }

        ArchitectVisit visit = architectVisitRepository.findById(visitId).orElse(null);
        if (visit == null || visit.getArchitect() == null
                || !architectId.equals(visit.getArchitect().getId())) {
            return ApiResponse.error("Visit not found for this architect");
        }

        // Delete through the repository only. Architect.visits is cascade=ALL/orphanRemoval, so
        // touching that collection as well would double-delete the row.
        architectVisitRepository.delete(visit);
        architectVisitRepository.flush();
        syncLastVisitDate(architect);

        return ApiResponse.success("Visit removed");
    }

    /**
     * lastVisitDate is a stored column (it backs the VISITED/NOT_VISITED filter and the "Recently
     * visited" sort), so it has to be recomputed from the visits table after any visit change
     * rather than written blindly from the request. Callers flush the visit change first.
     */
    private void syncLastVisitDate(Architect architect) {
        LocalDateTime latest = architectVisitRepository
                .findFirstByArchitectIdOrderByVisitDateDesc(architect.getId())
                .map(ArchitectVisit::getVisitDate)
                .orElse(null);
        architect.setLastVisitDate(latest);
        architectRepository.save(architect);
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
        dto.setPartnerType(architect.getPartnerType());
        dto.setFirm(architect.getFirm());
        dto.setContactNumber(architect.getContactNumber());
        dto.setPrincipalArchitectName(architect.getPrincipalArchitectName());
        dto.setEmail(architect.getEmail());
        dto.setLocation(architect.getLocation());
        dto.setHighlighted(Boolean.TRUE.equals(architect.getHighlighted()));
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

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Long>> getCounts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        long architects = architectRepository.countByPartnerType(Architect.PartnerType.ARCHITECT);
        long builders = architectRepository.countByPartnerType(Architect.PartnerType.BUILDER);
        counts.put("all", architects + builders);
        counts.put("architect", architects);
        counts.put("builder", builders);
        return ApiResponse.success(counts);
    }

    @Override
    @Transactional
    public ApiResponse<ArchitectNoteDto> addNote(Long architectId, String note, String author) {
        Architect architect = architectRepository.findById(architectId).orElse(null);
        if (architect == null) {
            return ApiResponse.error("Architect not found");
        }
        if (note == null || note.trim().isEmpty()) {
            return ApiResponse.error("Note cannot be empty");
        }
        ArchitectNote entry = new ArchitectNote();
        entry.setArchitect(architect);
        entry.setNote(note.trim());
        entry.setCreatedBy(author);
        entry.setCreatedAt(LocalDateTime.now());
        return ApiResponse.success("Note added", toNoteDto(architectNoteRepository.save(entry)));
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<ArchitectNoteDto>> getNotes(Long architectId) {
        List<ArchitectNoteDto> notes = architectNoteRepository
                .findByArchitectIdOrderByCreatedAtDescIdDesc(architectId)
                .stream().map(this::toNoteDto).collect(Collectors.toList());
        return ApiResponse.success(notes);
    }

    private ArchitectNoteDto toNoteDto(ArchitectNote n) {
        return new ArchitectNoteDto(n.getId(), n.getArchitect().getId(), n.getNote(),
                n.getCreatedBy(), n.getCreatedAt());
    }
}
