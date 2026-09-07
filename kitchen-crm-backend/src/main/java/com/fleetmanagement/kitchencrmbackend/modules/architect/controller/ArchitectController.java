package com.fleetmanagement.kitchencrmbackend.modules.architect.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectVisitCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectVisitDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import com.fleetmanagement.kitchencrmbackend.modules.architect.service.ArchitectService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectNoteRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/architects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ArchitectController {

    /**
     * Sort keys are interpolated straight into Sort.by(), which throws
     * PropertyReferenceException (a 500) for anything that is not a mapped property.
     */
    private static final Set<String> SORTABLE = Set.of(
            "architectureName", "firm", "contactNumber", "principalArchitectName",
            "partnerType", "lastVisitDate", "createdAt", "updatedAt");

    @Autowired
    private ArchitectService architectService;

    private Pageable pageableOf(int page, int size, String sortBy, String sortDir) {
        String safeSortBy = SORTABLE.contains(sortBy) ? sortBy : "architectureName";
        Sort requested = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(safeSortBy).descending()
                : Sort.by(safeSortBy).ascending();
        // Highlighted (starred) partners always float to the top, whatever the chosen sort.
        Sort sort = Sort.by(Sort.Order.desc("highlighted")).and(requested);
        return PageRequest.of(page, size, sort);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ArchitectDto>>> getAllArchitects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "architectureName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String visitStatus,
            @RequestParam(required = false) Boolean highlighted,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Architect.PartnerType partnerType) {

        return ResponseEntity.ok(architectService.getAllArchitects(
                pageableOf(page, size, sortBy, sortDir), visitStatus, highlighted, search, partnerType));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<ArchitectDto>>> getAllArchitectsList(
            @RequestParam(required = false) Architect.PartnerType partnerType) {
        return ResponseEntity.ok(architectService.getAllArchitects(partnerType));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ArchitectDto>>> searchArchitects(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "architectureName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) Architect.PartnerType partnerType) {

        return ResponseEntity.ok(architectService.searchArchitects(
                searchTerm, pageableOf(page, size, sortBy, sortDir), partnerType));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ArchitectDto>> getArchitectById(@PathVariable Long id) {
        ApiResponse<ArchitectDto> response = architectService.getArchitectById(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ArchitectDto>> createArchitect(@Valid @RequestBody ArchitectCreateDto architectCreateDto) {
        ApiResponse<ArchitectDto> response = architectService.createArchitect(architectCreateDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ArchitectDto>> updateArchitect(
            @PathVariable Long id,
            @Valid @RequestBody ArchitectUpdateDto architectUpdateDto) {
        ApiResponse<ArchitectDto> response = architectService.updateArchitect(id, architectUpdateDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteArchitect(@PathVariable Long id) {
        ApiResponse<String> response = architectService.deleteArchitect(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/{id}/visits")
    public ResponseEntity<ApiResponse<ArchitectVisitDto>> recordVisit(
            @PathVariable Long id,
            @Valid @RequestBody ArchitectVisitCreateDto visitCreateDto) {
        String visitedBy = getCurrentUserName();
        visitCreateDto.setArchitectId(id);
        ApiResponse<ArchitectVisitDto> response = architectService.recordVisit(visitCreateDto, visitedBy);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/{id}/visits/quick")
    public ResponseEntity<ApiResponse<ArchitectVisitDto>> markAsVisited(@PathVariable Long id) {
        String visitedBy = getCurrentUserName();
        ApiResponse<ArchitectVisitDto> response = architectService.markAsVisited(id, visitedBy);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{id}/visits")
    public ResponseEntity<ApiResponse<List<ArchitectVisitDto>>> getVisitHistory(@PathVariable Long id) {
        ApiResponse<List<ArchitectVisitDto>> response = architectService.getVisitHistory(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Undo a recorded visit. Any authenticated user, like recordVisit — visitedBy is free text and
     * ArchitectVisit carries no created_by, so an author-only rule is not enforceable.
     */
    @DeleteMapping("/{id}/visits/{visitId}")
    public ResponseEntity<ApiResponse<String>> deleteVisit(
            @PathVariable Long id,
            @PathVariable Long visitId) {
        ApiResponse<String> response = architectService.deleteVisit(id, visitId);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    private String getCurrentUserName() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            return userPrincipal.getName();
        }
        return "System";
    }

    /** True per-type totals for the filter chips (the paged list only knows the current page). */
    @GetMapping("/counts")
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> getCounts() {
        return ResponseEntity.ok(architectService.getCounts());
    }

    @GetMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<java.util.List<com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectNoteDto>>> getNotes(
            @PathVariable Long id) {
        return ResponseEntity.ok(architectService.getNotes(id));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectNoteDto>> addNote(
            @PathVariable Long id,
            @Valid @RequestBody ArchitectNoteRequest request) {
        return ResponseEntity.ok(architectService.addNote(id, request.getNote(), getCurrentUserName()));
    }
}
