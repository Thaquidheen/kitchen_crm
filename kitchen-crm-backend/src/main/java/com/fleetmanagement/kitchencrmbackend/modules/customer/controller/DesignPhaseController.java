package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.DesignPhaseService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/design-phase")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DesignPhaseController {

    @Autowired
    private DesignPhaseService designPhaseService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DesignPhaseDto>>> getAllDesignPhases(
            @RequestParam(required = false) DesignPhase.DesignStatus designStatus,
            @RequestParam(required = false) String designerAssigned,
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) Boolean submittedToClient,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(designPhaseService.getAllDesignPhases(
                designStatus, designerAssigned, customerName, submittedToClient, pageable));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDesignPhaseStatistics() {
        return ResponseEntity.ok(designPhaseService.getDesignPhaseStatistics());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<DesignPhaseDto>> getDesignPhaseByCustomer(
            @PathVariable Long customerId) {
        ApiResponse<DesignPhaseDto> response = designPhaseService.getDesignPhaseByCustomer(customerId);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<DesignPhaseDto>>> getDesignsByStatus(
            @PathVariable DesignPhase.DesignStatus status) {
        return ResponseEntity.ok(designPhaseService.getDesignsByStatus(status));
    }

    @GetMapping("/designer/{designerAssigned}")
    public ResponseEntity<ApiResponse<List<DesignPhaseDto>>> getDesignsByDesigner(
            @PathVariable String designerAssigned) {
        return ResponseEntity.ok(designPhaseService.getDesignsByDesigner(designerAssigned));
    }

    @GetMapping("/meetings/upcoming")
    public ResponseEntity<ApiResponse<List<DesignPhaseDto>>> getUpcomingMeetings(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {
        return ResponseEntity.ok(designPhaseService.getUpcomingMeetings(fromDate, toDate));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DesignPhaseDto>> createDesignPhase(
            @Valid @RequestBody DesignPhaseCreateDto designPhaseCreateDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<DesignPhaseDto> response = designPhaseService.createDesignPhase(
                designPhaseCreateDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<DesignPhaseDto>> updateDesignPhase(
            @PathVariable Long customerId,
            @Valid @RequestBody DesignPhaseDto designPhaseDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<DesignPhaseDto> response = designPhaseService.updateDesignPhase(
                customerId, designPhaseDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/customer/{customerId}/submit-to-client")
    public ResponseEntity<ApiResponse<String>> submitDesignToClient(
            @PathVariable Long customerId,
            @Valid @RequestBody DesignSubmissionDto submissionDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<String> response = designPhaseService.submitDesignToClient(
                customerId, submissionDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/customer/{customerId}/client-feedback")
    public ResponseEntity<ApiResponse<String>> recordClientFeedback(
            @PathVariable Long customerId,
            @Valid @RequestBody ClientFeedbackDto feedbackDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<String> response = designPhaseService.recordClientFeedback(
                customerId, feedbackDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/customer/{customerId}/schedule-meeting")
    public ResponseEntity<ApiResponse<String>> scheduleMeeting(
            @PathVariable Long customerId,
            @Valid @RequestBody MeetingScheduleDto meetingDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<String> response = designPhaseService.scheduleMeeting(
                customerId, meetingDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/customer/{customerId}/complete-meeting")
    public ResponseEntity<ApiResponse<String>> completeMeeting(
            @PathVariable Long customerId,
            @RequestParam String meetingNotes,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(designPhaseService.completeMeeting(
                customerId, meetingNotes, currentUser.getName()));
    }

    @PostMapping("/customer/{customerId}/freeze-amount")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> freezeDesignAmount(
            @PathVariable Long customerId,
            @RequestParam BigDecimal amount,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(designPhaseService.freezeDesignAmount(
                customerId, amount, currentUser.getName()));
    }

    @PostMapping("/customer/{customerId}/create-group")
    public ResponseEntity<ApiResponse<String>> createClientGroup(
            @PathVariable Long customerId,
            @RequestParam String whatsappGroupLink,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(designPhaseService.createClientGroup(
                customerId, whatsappGroupLink, currentUser.getName()));
    }

    @PatchMapping("/customer/{customerId}/status")
    public ResponseEntity<ApiResponse<String>> updateDesignStatus(
            @PathVariable Long customerId,
            @RequestParam DesignPhase.DesignStatus status,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(designPhaseService.updateDesignStatus(
                customerId, status, currentUser.getName()));
    }

    @PostMapping("/customer/{customerId}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> approveDesign(
            @PathVariable Long customerId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(designPhaseService.approveDesign(
                customerId, currentUser.getName()));
    }
}