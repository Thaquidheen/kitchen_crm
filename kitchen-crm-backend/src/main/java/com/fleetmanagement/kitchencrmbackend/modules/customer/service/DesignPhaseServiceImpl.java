package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.WorkflowHistory;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.DesignPhaseRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.WorkflowHistoryRepository;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class DesignPhaseServiceImpl implements DesignPhaseService {

    @Autowired
    private DesignPhaseRepository designPhaseRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private WorkflowHistoryRepository workflowHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public ApiResponse<Page<DesignPhaseDto>> getAllDesignPhases(DesignPhase.DesignStatus designStatus,
                                                                Long staffAssignedId,
                                                                String customerName,
                                                                Boolean submittedToClient,
                                                                Pageable pageable) {
        // Log the filters for debugging
        System.out.println("Getting design phases with filters: " +
                "designStatus=" + designStatus +
                ", staffAssignedId=" + staffAssignedId +
                ", customerName=" + customerName +
                ", submittedToClient=" + submittedToClient +
                ", page=" + pageable.getPageNumber() +
                ", size=" + pageable.getPageSize());
        
        Page<DesignPhase> designPhases = designPhaseRepository.findByFilters(
                designStatus, staffAssignedId, customerName, submittedToClient, pageable);

        System.out.println("Found " + designPhases.getTotalElements() + " design phases (total), " +
                designPhases.getContent().size() + " in current page");

        Page<DesignPhaseDto> designPhaseDtos = designPhases.map(this::convertToDto);
        return ApiResponse.success(designPhaseDtos);
    }

    @Override
    public ApiResponse<DesignPhaseDto> getDesignPhaseByCustomer(Long customerId) {
        DesignPhase designPhase = designPhaseRepository.findByCustomerId(customerId).orElse(null);
        if (designPhase == null) {
            return ApiResponse.success("No design phase found for customer", null);
        }
        return ApiResponse.success(convertToDto(designPhase));
    }

    @Override
    public ApiResponse<Boolean> checkDesignPhaseExists(Long customerId) {
        boolean exists = designPhaseRepository.findByCustomerId(customerId).isPresent();
        return ApiResponse.success(exists);
    }

    @Override
    public ApiResponse<DesignPhaseDto> createDesignPhase(DesignPhaseCreateDto designPhaseCreateDto, String createdBy) {
        // Validate customer exists
        Customer customer = customerRepository.findById(designPhaseCreateDto.getCustomerId()).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }

        // Check if design phase already exists for customer
        Optional<DesignPhase> existingDesignPhase = designPhaseRepository.findByCustomerId(designPhaseCreateDto.getCustomerId());
        if (existingDesignPhase.isPresent()) {
            return ApiResponse.error("Design phase already exists for this customer. Use update instead.");
        }

        // Validate quotation if provided
        Quotation quotation = null;
        if (designPhaseCreateDto.getQuotationId() != null) {
            quotation = quotationRepository.findById(designPhaseCreateDto.getQuotationId()).orElse(null);
            if (quotation == null) {
                return ApiResponse.error("Quotation not found");
            }
        }

        // Validate staff user if provided
        User staffAssigned = null;
        if (designPhaseCreateDto.getStaffAssignedId() != null) {
            staffAssigned = userRepository.findById(designPhaseCreateDto.getStaffAssignedId()).orElse(null);
            if (staffAssigned == null) {
                return ApiResponse.error("Staff user not found");
            }
            // Verify user has ROLE_STAFF
            boolean isStaff = staffAssigned.getRoles().stream()
                    .anyMatch(role -> role.getName().name().equals("ROLE_STAFF"));
            if (!isStaff) {
                return ApiResponse.error("User is not a staff member");
            }
        }

        DesignPhase designPhase = new DesignPhase();
        designPhase.setCustomer(customer);
        designPhase.setQuotation(quotation);
        designPhase.setDesignRequirements(designPhaseCreateDto.getDesignRequirements());
        designPhase.setStaffAssigned(staffAssigned); // Set Staff User entity
        designPhase.setDesignStatus(DesignPhase.DesignStatus.PLANNING);

        DesignPhase savedDesignPhase = designPhaseRepository.save(designPhase);

        System.out.println("Design phase created successfully: ID=" + savedDesignPhase.getId() +
                ", CustomerID=" + savedDesignPhase.getCustomer().getId() +
                ", Status=" + savedDesignPhase.getDesignStatus() +
                ", StaffAssignedID=" + (savedDesignPhase.getStaffAssigned() != null ? savedDesignPhase.getStaffAssigned().getId() : "null"));

        // Create workflow history
        createWorkflowHistory(customer, "Design Phase Created", "PLANNING", createdBy, "Design phase initiated");

        return ApiResponse.success("Design phase created successfully", convertToDto(savedDesignPhase));
    }

    @Override
    public ApiResponse<DesignPhaseDto> updateDesignPhase(Long customerId, DesignPhaseDto designPhaseDto, String updatedBy) {
        DesignPhase existingDesignPhase = designPhaseRepository.findByCustomerId(customerId).orElse(null);
        if (existingDesignPhase == null) {
            return ApiResponse.error("Design phase not found for customer");
        }

        // Update design phase details
        existingDesignPhase.setPlan(designPhaseDto.getPlan());
        existingDesignPhase.setDesign(designPhaseDto.getDesign());
        existingDesignPhase.setDesignRequirements(designPhaseDto.getDesignRequirements());
        
        // Handle staff assignment update
        if (designPhaseDto.getStaffAssignedId() != null) {
            User staffAssigned = userRepository.findById(designPhaseDto.getStaffAssignedId()).orElse(null);
            if (staffAssigned == null) {
                return ApiResponse.error("Staff user not found");
            }
            // Verify user has ROLE_STAFF
            boolean isStaff = staffAssigned.getRoles().stream()
                    .anyMatch(role -> role.getName().name().equals("ROLE_STAFF"));
            if (!isStaff) {
                return ApiResponse.error("User is not a staff member");
            }
            existingDesignPhase.setStaffAssigned(staffAssigned);
            // Update status to IN_PROGRESS when staff is assigned
            if (existingDesignPhase.getDesignStatus() == DesignPhase.DesignStatus.PLANNING) {
                existingDesignPhase.setDesignStatus(DesignPhase.DesignStatus.IN_PROGRESS);
            }
        }
        
        existingDesignPhase.setDesignCompletionPercentage(designPhaseDto.getDesignCompletionPercentage());
        existingDesignPhase.setDesignFilesPath(designPhaseDto.getDesignFilesPath());

        DesignPhase updatedDesignPhase = designPhaseRepository.save(existingDesignPhase);

        // Create workflow history
        createWorkflowHistory(existingDesignPhase.getCustomer(), "Design Phase Updated",
                existingDesignPhase.getDesignStatus().name(), updatedBy, "Design phase details updated");

        return ApiResponse.success("Design phase updated successfully", convertToDto(updatedDesignPhase));
    }

    @Override
    public ApiResponse<DesignPhaseDto> submitDesignToClient(Long customerId, DesignSubmissionDto submissionDto, String submittedBy) {
        DesignPhase designPhase = designPhaseRepository.findByCustomerId(customerId).orElse(null);
        if (designPhase == null) {
            return ApiResponse.error("Design phase not found for customer");
        }

        // If design status is not IN_PROGRESS, update it automatically
        if (designPhase.getDesignStatus() != DesignPhase.DesignStatus.IN_PROGRESS) {
            designPhase.setDesignStatus(DesignPhase.DesignStatus.IN_PROGRESS);
            designPhaseRepository.save(designPhase);
            
            // Create workflow history for status update
            createWorkflowHistory(designPhase.getCustomer(), "Design Status Updated", "IN_PROGRESS", submittedBy,
                    "Design status automatically updated to In Progress for submission");
        }

        // Check if design was approved by admin before submitting to client
        if (designPhase.getDesignStatus() != DesignPhase.DesignStatus.APPROVED_BY_ADMIN && 
            designPhase.getDesignStatus() != DesignPhase.DesignStatus.IN_PROGRESS) {
            return ApiResponse.error("Design must be approved by admin or in progress before submitting to client");
        }

        // Now proceed with the submission
        designPhase.setDesign(submissionDto.getDesign());
        designPhase.setDesignFilesPath(submissionDto.getDesignFilesPath());
        designPhase.setSubmittedToClient(true);
        designPhase.setSubmissionDate(LocalDateTime.now());
        designPhase.setDesignStatus(DesignPhase.DesignStatus.SUBMITTED);

        DesignPhase savedDesignPhase = designPhaseRepository.save(designPhase);

        // Create workflow history for submission
        createWorkflowHistory(designPhase.getCustomer(), "Design Submitted", "SUBMITTED", submittedBy,
                "Design submitted to client for review");

        return ApiResponse.success("Design submitted to client successfully", convertToDto(savedDesignPhase));
    }

    @Override
    public ApiResponse<String> recordClientFeedback(Long customerId, ClientFeedbackDto feedbackDto, String recordedBy) {
        DesignPhase designPhase = designPhaseRepository.findByCustomerId(customerId).orElse(null);
        if (designPhase == null) {
            return ApiResponse.error("Design phase not found for customer");
        }

        if (designPhase.getDesignStatus() != DesignPhase.DesignStatus.SUBMITTED) {
            return ApiResponse.error("Design must be submitted before receiving feedback");
        }

        designPhase.setClientFeedback(feedbackDto.getClientFeedback());
        designPhase.setFeedbackDate(LocalDateTime.now());

        if (feedbackDto.getRequiresRevision() != null && feedbackDto.getRequiresRevision()) {
            designPhase.setDesignStatus(DesignPhase.DesignStatus.REVISION_REQUIRED);
            designPhase.setRevisionCount(designPhase.getRevisionCount() + 1);
        } else {
            designPhase.setDesignStatus(DesignPhase.DesignStatus.FEEDBACK_RECEIVED);
        }

        designPhaseRepository.save(designPhase);

        // Create workflow history
        String status = feedbackDto.getRequiresRevision() != null && feedbackDto.getRequiresRevision() ?
                "REVISION_REQUIRED" : "FEEDBACK_RECEIVED";
        createWorkflowHistory(designPhase.getCustomer(), "Client Feedback Received", status, recordedBy,
                "Client feedback: " + feedbackDto.getClientFeedback());

        return ApiResponse.success("Client feedback recorded successfully");
    }

    @Override
    public ApiResponse<String> scheduleMeeting(Long customerId, MeetingScheduleDto meetingDto, String scheduledBy) {
        DesignPhase designPhase = designPhaseRepository.findByCustomerId(customerId).orElse(null);
        if (designPhase == null) {
            return ApiResponse.error("Design phase not found for customer");
        }

        designPhase.setMeetingScheduled(meetingDto.getMeetingDateTime());
        designPhase.setMeetingCompleted(false);

        designPhaseRepository.save(designPhase);

        // Create workflow history
        createWorkflowHistory(designPhase.getCustomer(), "Meeting Scheduled",
                designPhase.getDesignStatus().name(), scheduledBy,
                "Meeting scheduled for " + meetingDto.getMeetingDateTime());

        return ApiResponse.success("Meeting scheduled successfully");
    }

    @Override
    public ApiResponse<String> completeMeeting(Long customerId, String meetingNotes, String completedBy) {
        DesignPhase designPhase = designPhaseRepository.findByCustomerId(customerId).orElse(null);
        if (designPhase == null) {
            return ApiResponse.error("Design phase not found for customer");
        }

        if (designPhase.getMeetingScheduled() == null) {
            return ApiResponse.error("No meeting scheduled for this customer");
        }

        designPhase.setMeetingCompleted(true);
        designPhase.setMeetingNotes(meetingNotes);

        designPhaseRepository.save(designPhase);

        // Create workflow history
        createWorkflowHistory(designPhase.getCustomer(), "Meeting Completed",
                designPhase.getDesignStatus().name(), completedBy,
                "Meeting completed. Notes: " + meetingNotes);

        return ApiResponse.success("Meeting marked as completed");
    }

    @Override
    public ApiResponse<String> freezeDesignAmount(Long customerId, BigDecimal amount, String frozenBy) {
        DesignPhase designPhase = designPhaseRepository.findByCustomerId(customerId).orElse(null);
        if (designPhase == null) {
            return ApiResponse.error("Design phase not found for customer");
        }

        if (!designPhase.canFreezeDesign()) {
            return ApiResponse.error("Design cannot be frozen. Must be approved first.");
        }

        designPhase.setDesignAmountFrozen(true);
        designPhase.setFrozenAmount(amount);
        designPhase.setDesignStatus(DesignPhase.DesignStatus.FROZEN);

        designPhaseRepository.save(designPhase);

        // Create workflow history
        createWorkflowHistory(designPhase.getCustomer(), "Design Amount Frozen", "FROZEN", frozenBy,
                "Design amount frozen at " + amount);

        return ApiResponse.success("Design amount frozen successfully");
    }

    @Override
    public ApiResponse<String> createClientGroup(Long customerId, String whatsappGroupLink, String createdBy) {
        DesignPhase designPhase = designPhaseRepository.findByCustomerId(customerId).orElse(null);
        if (designPhase == null) {
            return ApiResponse.error("Design phase not found for customer");
        }

        designPhase.setClientGroupCreated(true);
        designPhase.setWhatsappGroupLink(whatsappGroupLink);

        designPhaseRepository.save(designPhase);

        // Create workflow history
        createWorkflowHistory(designPhase.getCustomer(), "Client Group Created",
                designPhase.getDesignStatus().name(), createdBy,
                "WhatsApp group created for client communication");

        return ApiResponse.success("Client group created successfully");
    }

    @Override
    public ApiResponse<String> updateDesignStatus(Long customerId, DesignPhase.DesignStatus status, String updatedBy) {
        DesignPhase designPhase = designPhaseRepository.findByCustomerId(customerId).orElse(null);
        if (designPhase == null) {
            return ApiResponse.error("Design phase not found for customer");
        }

        DesignPhase.DesignStatus previousStatus = designPhase.getDesignStatus();
        designPhase.setDesignStatus(status);

        // Set progress based on status
        if (status == DesignPhase.DesignStatus.IN_PROGRESS) {
            designPhase.setDesignCompletionPercentage(25);
        } else if (status == DesignPhase.DesignStatus.SUBMITTED) {
            designPhase.setDesignCompletionPercentage(75);
        } else if (status == DesignPhase.DesignStatus.APPROVED) {
            designPhase.setDesignCompletionPercentage(90);
        } else if (status == DesignPhase.DesignStatus.FROZEN) {
            designPhase.setDesignCompletionPercentage(100);
        }

        designPhaseRepository.save(designPhase);

        // Create workflow history
        createWorkflowHistory(designPhase.getCustomer(), "Design Status Updated", status.name(), updatedBy,
                "Status changed from " + previousStatus + " to " + status);

        return ApiResponse.success("Design status updated successfully");
    }

    @Override
    public ApiResponse<String> approveDesign(Long customerId, String approvedBy) {
        DesignPhase designPhase = designPhaseRepository.findByCustomerId(customerId).orElse(null);
        if (designPhase == null) {
            return ApiResponse.error("Design phase not found for customer");
        }

        if (designPhase.getDesignStatus() != DesignPhase.DesignStatus.FEEDBACK_RECEIVED &&
                designPhase.getDesignStatus() != DesignPhase.DesignStatus.SUBMITTED) {
            return ApiResponse.error("Design must have client feedback before approval");
        }

        designPhase.setDesignStatus(DesignPhase.DesignStatus.APPROVED);
        designPhase.setClientApprovalDate(LocalDateTime.now());
        designPhase.setDesignCompletionPercentage(90);

        designPhaseRepository.save(designPhase);


        // Create workflow history
        createWorkflowHistory(designPhase.getCustomer(), "Design Approved", "APPROVED", approvedBy,
                "Design approved by client");

        return ApiResponse.success("Design approved successfully");
    }

    @Override
    public ApiResponse<DesignPhaseDto> submitForSuperadminApproval(Long customerId, DesignSubmissionDto submissionDto, String submittedBy) {
        DesignPhase designPhase = designPhaseRepository.findByCustomerId(customerId).orElse(null);
        if (designPhase == null) {
            return ApiResponse.error("Design phase not found for customer");
        }

        // Check if design phase is in a valid state for submission
        if (designPhase.getDesignStatus() != DesignPhase.DesignStatus.IN_PROGRESS) {
            return ApiResponse.error("Design must be in progress to submit for approval");
        }

        // Update design content
        designPhase.setDesign(submissionDto.getDesign());
        designPhase.setDesignFilesPath(submissionDto.getDesignFilesPath());
        designPhase.setDesignStatus(DesignPhase.DesignStatus.PENDING_SUPERADMIN_APPROVAL);
        designPhase.setDesignCompletionPercentage(50); // Update progress

        DesignPhase savedDesignPhase = designPhaseRepository.save(designPhase);

        // Create workflow history
        createWorkflowHistory(designPhase.getCustomer(), "Design Submitted for Approval", "PENDING_SUPERADMIN_APPROVAL", submittedBy,
                "Design submitted to superadmin for approval");

        return ApiResponse.success("Design submitted for approval successfully", convertToDto(savedDesignPhase));
    }

    @Override
    public ApiResponse<DesignPhaseDto> approveStaffSubmission(Long customerId, String approvedBy) {
        DesignPhase designPhase = designPhaseRepository.findByCustomerId(customerId).orElse(null);
        if (designPhase == null) {
            return ApiResponse.error("Design phase not found for customer");
        }

        if (designPhase.getDesignStatus() != DesignPhase.DesignStatus.PENDING_SUPERADMIN_APPROVAL) {
            return ApiResponse.error("Design must be pending superadmin approval");
        }

        // Update status to approved by admin
        designPhase.setDesignStatus(DesignPhase.DesignStatus.APPROVED_BY_ADMIN);
        designPhase.setDesignCompletionPercentage(75); // Update progress

        DesignPhase savedDesignPhase = designPhaseRepository.save(designPhase);

        // Create workflow history
        createWorkflowHistory(designPhase.getCustomer(), "Design Approved by Admin", "APPROVED_BY_ADMIN", approvedBy,
                "Design approved by superadmin. Ready to submit to client.");

        // Note: Files are already uploaded during submission, they will appear in Files tab automatically
        // The designFilesPath contains reference to the files

        return ApiResponse.success("Design approved successfully. Ready to submit to client.", convertToDto(savedDesignPhase));
    }

    @Override
    public ApiResponse<List<DesignPhaseDto>> getDesignPhasesByAssignedStaff(Long staffId) {
        List<DesignPhase> designPhases = designPhaseRepository.findByStaffAssignedId(staffId);
        List<DesignPhaseDto> designPhaseDtos = designPhases.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(designPhaseDtos);
    }

    @Override
    public ApiResponse<List<DesignPhaseDto>> getDesignsByStatus(DesignPhase.DesignStatus status) {
        List<DesignPhase> designPhases = designPhaseRepository.findByDesignStatus(status);
        List<DesignPhaseDto> designPhaseDtos = designPhases.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(designPhaseDtos);
    }

    @Override
    public ApiResponse<List<DesignPhaseDto>> getUpcomingMeetings(LocalDateTime fromDate, LocalDateTime toDate) {
        List<DesignPhase> designPhases = designPhaseRepository.findMeetingsInDateRange(fromDate, toDate);
        List<DesignPhaseDto> designPhaseDtos = designPhases.stream()
                .filter(dp -> dp.getMeetingScheduled() != null && !dp.getMeetingCompleted())
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(designPhaseDtos);
    }

    @Override
    public ApiResponse<Map<String, Object>> getDesignPhaseStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Design counts by status
        for (DesignPhase.DesignStatus status : DesignPhase.DesignStatus.values()) {
            Long count = designPhaseRepository.countByDesignStatus(status);
            stats.put(status.name().toLowerCase() + "_designs", count);
        }

        // Total designs
        stats.put("total_designs", designPhaseRepository.count());

        // Ready to freeze designs
        List<DesignPhase> readyToFreeze = designPhaseRepository.findReadyToFreeze();
        stats.put("ready_to_freeze", readyToFreeze.size());

        // Ready for client group
        List<DesignPhase> readyForGroup = designPhaseRepository.findReadyForClientGroup();
        stats.put("ready_for_client_group", readyForGroup.size());

        // Pending submissions
        long pendingSubmissions = designPhaseRepository.countByDesignStatus(DesignPhase.DesignStatus.IN_PROGRESS);
        stats.put("pending_submissions", pendingSubmissions);

        // Pending feedback
        long pendingFeedback = designPhaseRepository.countByDesignStatus(DesignPhase.DesignStatus.SUBMITTED);
        stats.put("pending_feedback", pendingFeedback);

        return ApiResponse.success(stats);
    }

    // Helper method to create workflow history
    private void createWorkflowHistory(Customer customer, String previousState, String newState,
                                       String changedBy, String reason) {
        WorkflowHistory history = new WorkflowHistory();
        history.setCustomer(customer);
        history.setPreviousState(previousState);
        history.setNewState(newState);
        history.setChangedBy(changedBy);
        history.setChangeReason(reason);
        history.setTimestamp(LocalDateTime.now());
        workflowHistoryRepository.save(history);
    }

    // Helper method to convert entity to DTO
    private DesignPhaseDto convertToDto(DesignPhase designPhase) {
        DesignPhaseDto dto = new DesignPhaseDto();
        dto.setId(designPhase.getId());
        dto.setCustomerId(designPhase.getCustomer().getId());
        dto.setCustomerName(designPhase.getCustomer().getName());

        if (designPhase.getQuotation() != null) {
            dto.setQuotationId(designPhase.getQuotation().getId());
            dto.setQuotationNumber(designPhase.getQuotation().getQuotationNumber());
        }

        dto.setPlan(designPhase.getPlan());
        dto.setDesign(designPhase.getDesign());
        dto.setDesignRequirements(designPhase.getDesignRequirements());
        dto.setSubmittedToClient(designPhase.getSubmittedToClient());
        dto.setSubmissionDate(designPhase.getSubmissionDate());
        dto.setClientFeedback(designPhase.getClientFeedback());
        dto.setFeedbackDate(designPhase.getFeedbackDate());
        dto.setMeetingScheduled(designPhase.getMeetingScheduled());
        dto.setMeetingCompleted(designPhase.getMeetingCompleted());
        dto.setMeetingNotes(designPhase.getMeetingNotes());
        dto.setDesignAmountFrozen(designPhase.getDesignAmountFrozen());
        dto.setFrozenAmount(designPhase.getFrozenAmount());
        dto.setClientGroupCreated(designPhase.getClientGroupCreated());
        dto.setWhatsappGroupLink(designPhase.getWhatsappGroupLink());
        dto.setDesignStatus(designPhase.getDesignStatus());
        
        // Handle staff assignment
        if (designPhase.getStaffAssigned() != null) {
            dto.setStaffAssignedId(designPhase.getStaffAssigned().getId());
            dto.setStaffAssignedName(designPhase.getStaffAssigned().getName());
        }
        
        dto.setDesignCompletionPercentage(designPhase.getDesignCompletionPercentage());
        dto.setRevisionCount(designPhase.getRevisionCount());
        dto.setClientApprovalDate(designPhase.getClientApprovalDate());
        dto.setDesignFilesPath(designPhase.getDesignFilesPath());

        // Set calculated fields
        dto.setOverallProgress(designPhase.getOverallProgress());
        dto.setCanFreezeDesign(designPhase.canFreezeDesign());

        dto.setCreatedAt(designPhase.getCreatedAt());
        dto.setUpdatedAt(designPhase.getUpdatedAt());

        return dto;
    }
}