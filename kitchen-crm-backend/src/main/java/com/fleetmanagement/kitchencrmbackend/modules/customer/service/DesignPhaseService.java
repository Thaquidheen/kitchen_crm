package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface DesignPhaseService {

    ApiResponse<Page<DesignPhaseDto>> getAllDesignPhases(DesignPhase.DesignStatus designStatus,
                                                         String designerAssigned,
                                                         String customerName,
                                                         Boolean submittedToClient,
                                                         Pageable pageable);

    ApiResponse<DesignPhaseDto> getDesignPhaseByCustomer(Long customerId);

    ApiResponse<DesignPhaseDto> createDesignPhase(DesignPhaseCreateDto designPhaseCreateDto, String createdBy);

    ApiResponse<DesignPhaseDto> updateDesignPhase(Long customerId, DesignPhaseDto designPhaseDto, String updatedBy);

    ApiResponse<String> submitDesignToClient(Long customerId, DesignSubmissionDto submissionDto, String submittedBy);

    ApiResponse<String> recordClientFeedback(Long customerId, ClientFeedbackDto feedbackDto, String recordedBy);

    ApiResponse<String> scheduleMeeting(Long customerId, MeetingScheduleDto meetingDto, String scheduledBy);

    ApiResponse<String> completeMeeting(Long customerId, String meetingNotes, String completedBy);

    ApiResponse<String> freezeDesignAmount(Long customerId, BigDecimal amount, String frozenBy);

    ApiResponse<String> createClientGroup(Long customerId, String whatsappGroupLink, String createdBy);

    ApiResponse<String> updateDesignStatus(Long customerId, DesignPhase.DesignStatus status, String updatedBy);

    ApiResponse<String> approveDesign(Long customerId, String approvedBy);

    ApiResponse<List<DesignPhaseDto>> getDesignsByStatus(DesignPhase.DesignStatus status);

    ApiResponse<List<DesignPhaseDto>> getDesignsByDesigner(String designerAssigned);

    ApiResponse<List<DesignPhaseDto>> getUpcomingMeetings(LocalDateTime fromDate, LocalDateTime toDate);

    ApiResponse<Map<String, Object>> getDesignPhaseStatistics();
}