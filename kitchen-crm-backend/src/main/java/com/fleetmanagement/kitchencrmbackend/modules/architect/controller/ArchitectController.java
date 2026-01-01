package com.fleetmanagement.kitchencrmbackend.modules.architect.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectVisitCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.dto.ArchitectVisitDto;
import com.fleetmanagement.kitchencrmbackend.modules.architect.service.ArchitectService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/architects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ArchitectController {

    @Autowired
    private ArchitectService architectService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ArchitectDto>>> getAllArchitects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "architectureName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String visitStatus) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return ResponseEntity.ok(architectService.getAllArchitects(pageable, visitStatus));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<ArchitectDto>>> getAllArchitectsList() {
        return ResponseEntity.ok(architectService.getAllArchitects());
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ArchitectDto>>> searchArchitects(
            @RequestParam String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "architectureName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return ResponseEntity.ok(architectService.searchArchitects(searchTerm, pageable));
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

    private String getCurrentUserName() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            return userPrincipal.getName();
        }
        return "System";
    }
}




