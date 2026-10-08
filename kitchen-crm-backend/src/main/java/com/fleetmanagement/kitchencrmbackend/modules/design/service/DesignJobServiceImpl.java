package com.fleetmanagement.kitchencrmbackend.modules.design.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignFileUploadRequest;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignPhaseFileDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer.CustomerStatus;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase.DesignStatus;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhaseFile;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.WorkflowHistory;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.DesignPhaseFileRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.WorkflowHistoryRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.DesignFileTypes;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.DesignPhaseFileService;
import com.fleetmanagement.kitchencrmbackend.modules.design.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.design.entity.DesignPhaseNote;
import com.fleetmanagement.kitchencrmbackend.modules.design.entity.DesignPhaseVersion;
import com.fleetmanagement.kitchencrmbackend.modules.design.repository.DesignJobRepository;
import com.fleetmanagement.kitchencrmbackend.modules.design.repository.DesignPhaseNoteRepository;
import com.fleetmanagement.kitchencrmbackend.modules.design.repository.DesignPhaseVersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class DesignJobServiceImpl implements DesignJobService {

    public static final String STAFF_TYPE_DESIGNER = "DESIGNER";
    public static final String STAFF_TYPE_ADMIN_STAFF = "ADMIN_STAFF";
    private static final Set<String> PRIORITIES = Set.of("LOW", "MEDIUM", "HIGH", "URGENT");
    private static final Set<String> DESIGNER_STATUSES = Set.of("AVAILABLE", "BUSY", "ON_LEAVE");

    /** The designer has work to do on these. */
    private static final Set<DesignStatus> DESIGNER_WORK = EnumSet.of(
            DesignStatus.PLANNING, DesignStatus.IN_PROGRESS, DesignStatus.REVISION_REQUIRED);
    /** The current version is not approved yet: with the designer, or with the admin for review. */
    private static final Set<DesignStatus> OPEN = EnumSet.of(
            DesignStatus.PLANNING, DesignStatus.IN_PROGRESS, DesignStatus.REVISION_REQUIRED,
            DesignStatus.PENDING_SUPERADMIN_APPROVAL);
    /** The current version is approved: this is a design a quotation can be made from. */
    private static final Set<DesignStatus> APPROVED_STATES = EnumSet.of(
            DesignStatus.APPROVED_BY_ADMIN, DesignStatus.SUBMITTED, DesignStatus.FEEDBACK_RECEIVED,
            DesignStatus.APPROVED, DesignStatus.FROZEN);
    /** Finished or stopped: not in any queue or bell. */
    private static final Set<DesignStatus> CLOSED = EnumSet.of(
            DesignStatus.APPROVED_BY_ADMIN, DesignStatus.SUBMITTED, DesignStatus.FEEDBACK_RECEIVED,
            DesignStatus.APPROVED, DesignStatus.FROZEN, DesignStatus.CANCELLED);
    /** What an admin may set by hand; approving and redesigning have their own actions. */
    private static final Set<DesignStatus> HAND_SET = EnumSet.of(
            DesignStatus.PLANNING, DesignStatus.IN_PROGRESS, DesignStatus.CANCELLED);
    /** Stages whose customers are listed with their design in the Designs module. */
    private static final List<CustomerStatus> PAST_DESIGN = List.of(
            CustomerStatus.QUOTE_GIVEN, CustomerStatus.FOLLOW_UP, CustomerStatus.NEGOTIATIONS, CustomerStatus.CONFIRMED);
    /** A redesign pulls the customer back into Design — except from these, where only the design reopens. */
    private static final Set<CustomerStatus> REDESIGN_KEEPS_STAGE = EnumSet.of(
            CustomerStatus.DESIGN_STAGE, CustomerStatus.CONFIRMED, CustomerStatus.LOST);

    @Autowired
    private DesignJobRepository jobRepository;
    @Autowired
    private DesignPhaseNoteRepository noteRepository;
    @Autowired
    private DesignPhaseVersionRepository versionRepository;
    @Autowired
    private DesignPhaseFileRepository fileRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private WorkflowHistoryRepository workflowHistoryRepository;
    @Autowired
    private DesignPhaseFileService fileService;

    @Value("${app.business-timezone:Asia/Kolkata}")
    private String businessTimezone;

    private LocalDate today() {
        return LocalDate.now(ZoneId.of(businessTimezone));
    }

    // ------------------------------------------------------------------ reads

    @Override
    @Transactional(readOnly = true)
    public DesignMeDto me(Long userId, boolean superAdmin) {
        DesignMeDto dto = new DesignMeDto();
        dto.setUserId(userId);
        User user = userId == null ? null : userRepository.findById(userId).orElse(null);
        if (user != null) {
            dto.setStaffType(user.getStaffType());
            dto.setDesignerStatus(user.getDesignerStatus());
        }
        dto.setDesigner(user != null && STAFF_TYPE_DESIGNER.equals(user.getStaffType()));
        dto.setCanAssign(superAdmin);
        dto.setCanCoordinate(superAdmin || isCoordinator(user));
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isCoordinator(Long userId) {
        return isCoordinator(userId == null ? null : userRepository.findById(userId).orElse(null));
    }

    private static boolean isCoordinator(User user) {
        return user != null && !Boolean.FALSE.equals(user.getActive()) && STAFF_TYPE_ADMIN_STAFF.equals(user.getStaffType());
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<DesignJobDto>> list(Long callerId, boolean admin, boolean coordinator, Long designerId,
                                                boolean includeClosed) {
        List<DesignPhase> jobs;
        if (!admin && !coordinator) {
            // A designer sees only their own jobs, whatever filter they send.
            jobs = callerId == null ? List.of() : jobRepository.findByDesigner(callerId);
        } else if (designerId != null) {
            jobs = jobRepository.findByDesigner(designerId);
        } else {
            jobs = jobRepository.findAllWithPeople();
        }
        List<DesignPhase> visible = jobs.stream()
                .filter(d -> includeClosed || !CLOSED.contains(status(d)))
                .sorted(QUEUE_ORDER)
                .collect(Collectors.toList());
        List<DesignJobDto> dtos = toDtos(visible);
        if (!admin && coordinator) {
            // Admin staff look after assignments and paperwork; the conversation stays with admin + designer.
            dtos.forEach(dto -> {
                if (callerId == null || !callerId.equals(dto.getDesignerId())) {
                    withoutConversation(dto);
                }
            });
        }
        return ApiResponse.success(dtos);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<DesignJobDto> get(Long jobId, Long callerId, boolean admin, boolean coordinator) {
        DesignPhase job = jobRepository.findById(jobId).orElse(null);
        boolean own = job != null && isAssignedDesigner(job, callerId);
        if (job == null || !(admin || coordinator || own)) {
            return ApiResponse.error("Design job not found");
        }
        DesignJobDto dto = detail(job);
        return ApiResponse.success(admin || own ? dto : withoutConversation(dto));
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<DesignJobDto> getForCustomer(Long customerId) {
        List<DesignPhase> jobs = jobRepository.findByCustomerNewestFirst(customerId);
        if (jobs.isEmpty()) {
            return ApiResponse.success("No design job", null);
        }
        // The customer page shows the design, its versions and files — the conversation stays
        // with admin + designer.
        return ApiResponse.success(withoutConversation(detail(jobs.get(0))));
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> unassignedCustomers() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Customer c : jobRepository.findUnassignedDesignCustomers(CustomerStatus.DESIGN_STAGE,
                DesignStatus.CANCELLED)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("customerId", c.getId());
            row.put("customerName", c.getName());
            row.put("customerPlace", c.getPlace());
            rows.add(row);
        }
        return ApiResponse.success(rows);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<DesignLibraryRowDto>> library() {
        List<Customer> customers = customerRepository.findByStatusIn(PAST_DESIGN);
        if (customers.isEmpty()) {
            return ApiResponse.success(new ArrayList<>());
        }
        List<Long> customerIds = customers.stream().map(Customer::getId).toList();
        // Newest design per customer (the query is newest-first).
        Map<Long, DesignPhase> jobByCustomer = new LinkedHashMap<>();
        for (DesignPhase job : jobRepository.findByCustomerIds(customerIds)) {
            jobByCustomer.putIfAbsent(job.getCustomer().getId(), job);
        }
        Map<Long, DesignJobDto> dtoByCustomer = new HashMap<>();
        for (DesignJobDto dto : toDtos(new ArrayList<>(jobByCustomer.values()))) {
            dtoByCustomer.put(dto.getCustomerId(), withoutConversation(dto));
        }
        List<DesignLibraryRowDto> rows = new ArrayList<>(customers.size());
        customers.stream()
                .sorted(Comparator.comparing(c -> c.getName() == null ? "" : c.getName().toLowerCase()))
                .forEach(c -> {
                    DesignLibraryRowDto row = new DesignLibraryRowDto();
                    row.setCustomerId(c.getId());
                    row.setCustomerName(c.getName());
                    row.setCustomerPlace(c.getPlace());
                    row.setCustomerStatus(c.getStatus() != null ? c.getStatus().name() : null);
                    row.setDesign(dtoByCustomer.get(c.getId()));
                    rows.add(row);
                });
        return ApiResponse.success(rows);
    }

    // ------------------------------------------------------------------ assignment

    @Override
    public String ensureAssignedForDesignStage(Customer customer, Long designerId, LocalDate dueDate, String priority,
                                               String brief, Long byUserId, boolean canAssign) {
        DesignPhase existing = latestJob(customer.getId());
        if (!canAssign) {
            // Not theirs to choose: whatever was sent is ignored, and the customer waits under
            // "To assign". An approved design is not reopened this way — that customer would sit
            // in Design with nobody told, so the redesign has to come from the admin.
            if (existing != null && APPROVED_STATES.contains(status(existing))) {
                return "This customer already has an approved design. Ask the admin to request a redesign";
            }
            return null;
        }
        if (designerId == null) {
            // Still with a designer (e.g. moved out of Design and back): nothing to choose.
            if (existing != null && existing.getStaffAssigned() != null && OPEN.contains(status(existing))) {
                return null;
            }
            return "Choose a designer for this design";
        }
        User designer = userRepository.findById(designerId).orElse(null);
        String designerError = validateDesigner(designer);
        if (designerError != null) {
            return designerError;
        }
        String normalizedPriority = normalizePriority(priority);
        if (priority != null && !priority.isBlank() && normalizedPriority == null) {
            return "Priority must be Low, Medium, High or Urgent";
        }
        // Valid — now write.
        if (existing != null && APPROVED_STATES.contains(status(existing))) {
            // Back into Design after an approved design: that is the next version of it.
            startNextVersion(existing, designer, brief, dueDate, normalizedPriority, byUserId);
            return null;
        }
        boolean isNew = existing == null;
        DesignPhase job = isNew ? newJob(customer) : existing;
        boolean cancelled = !isNew && status(job) == DesignStatus.CANCELLED;
        boolean newDesigner = job.getStaffAssigned() == null || !job.getStaffAssigned().getId().equals(designer.getId());
        if (isNew || cancelled || newDesigner) {
            assignTo(job, designer, byUserId);
        }
        if (cancelled) {
            // A cancelled design picked up again continues as the same version.
            job.setDesignStatus(DesignStatus.PLANNING);
            job.setCompletedAt(null);
            job.setCompletionSeenAt(null);
        }
        if (dueDate != null) {
            job.setDueDate(dueDate);
        }
        if (normalizedPriority != null) {
            job.setPriority(normalizedPriority);
        }
        if (brief != null && !brief.isBlank() && (job.getDesignRequirements() == null || job.getDesignRequirements().isBlank())) {
            job.setDesignRequirements(brief.trim());
        }
        jobRepository.save(job);
        DesignPhaseVersion row = isNew
                ? newVersionRow(job, DesignPhaseVersion.ORIGIN_DESIGNER, job.getDesignRequirements(), byUserId, userName(byUserId))
                : currentVersionRow(job);
        if (row.getRequestNote() == null) {
            // The design waited without a designer (it held plan documents only): this is its brief.
            row.setRequestNote(job.getDesignRequirements());
        }
        row.setDesignerUserId(designer.getId());
        row.setDesignerName(designer.getName());
        versionRepository.save(row);
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public String requireDesignForQuotationStage(Customer customer) {
        DesignPhase job = latestJob(customer.getId());
        if (job != null && APPROVED_STATES.contains(status(job))) {
            return null;
        }
        if (job != null && OPEN.contains(status(job)) && job.getStaffAssigned() != null) {
            return "The design is still with " + job.getStaffAssigned().getName()
                    + ". The customer moves to Quotation Stage when the admin approves it.";
        }
        return "Upload the design to move this customer to Quotation Stage";
    }

    @Override
    public ApiResponse<DesignJobDto> assign(DesignAssignRequest request, Long adminId) {
        Customer customer = customerRepository.findById(request.getCustomerId()).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }
        String error = ensureAssignedForDesignStage(customer, request.getDesignerId(), request.getDueDate(),
                request.getPriority(), request.getBrief(), adminId, true);
        if (error != null) {
            return ApiResponse.error(error);
        }
        return ApiResponse.success("Designer assigned", withoutConversation(detail(latestJob(customer.getId()))));
    }

    @Override
    public ApiResponse<DesignJobDto> update(Long jobId, DesignJobUpdateRequest request, Long adminId) {
        DesignPhase job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            return ApiResponse.error("Design job not found");
        }
        User newDesigner = null;
        if (request.getDesignerId() != null
                && (job.getStaffAssigned() == null || !job.getStaffAssigned().getId().equals(request.getDesignerId()))) {
            newDesigner = userRepository.findById(request.getDesignerId()).orElse(null);
            String designerError = validateDesigner(newDesigner);
            if (designerError != null) {
                return ApiResponse.error(designerError);
            }
        }
        String priority = null;
        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            priority = normalizePriority(request.getPriority());
            if (priority == null) {
                return ApiResponse.error("Priority must be Low, Medium, High or Urgent");
            }
        }
        DesignStatus newStatus = null;
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                newStatus = DesignStatus.valueOf(request.getStatus().trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                return ApiResponse.error("Unknown design status: " + request.getStatus());
            }
            if (newStatus == status(job)) {
                newStatus = null;
            }
        }
        if (newStatus != null) {
            if (APPROVED_STATES.contains(status(job))) {
                return ApiResponse.error("This design is approved. Request a redesign to change it.");
            }
            if (!HAND_SET.contains(newStatus)) {
                return ApiResponse.error("That status is set by the designer completing the design and the admin reviewing it");
            }
        }
        if (newDesigner != null) {
            assignTo(job, newDesigner, adminId);
            DesignPhaseVersion row = currentVersionRow(job);
            row.setDesignerUserId(newDesigner.getId());
            row.setDesignerName(newDesigner.getName());
            versionRepository.save(row);
        }
        if (Boolean.TRUE.equals(request.getClearDueDate())) {
            job.setDueDate(null);
        } else if (request.getDueDate() != null) {
            job.setDueDate(request.getDueDate());
        }
        if (priority != null) {
            job.setPriority(priority);
        }
        if (request.getBrief() != null) {
            job.setDesignRequirements(request.getBrief().isBlank() ? null : request.getBrief().trim());
        }
        if (newStatus != null) {
            job.setDesignStatus(newStatus);
            if (newStatus == DesignStatus.IN_PROGRESS && job.getStartedAt() == null) {
                job.setStartedAt(LocalDateTime.now());
            }
        }
        // Any admin edit is news for the designer (new date, priority, brief or status).
        job.setDesignerSeenAt(null);
        jobRepository.save(job);
        return ApiResponse.success("Design job updated", detail(job));
    }

    @Override
    public ApiResponse<List<DesignJobDto>> reorder(DesignReorderRequest request) {
        List<DesignPhase> jobs = jobRepository.findByDesigner(request.getDesignerId());
        Map<Long, DesignPhase> byId = jobs.stream().collect(Collectors.toMap(DesignPhase::getId, j -> j));
        int position = 1;
        Set<Long> placed = new HashSet<>();
        for (Long id : request.getJobIds()) {
            DesignPhase job = byId.get(id);
            if (job == null || !placed.add(id)) {
                continue;
            }
            job.setQueuePosition(position++);
        }
        // Jobs the request did not mention keep their relative order after the ones it did.
        List<DesignPhase> rest = jobs.stream().filter(j -> !placed.contains(j.getId())).sorted(QUEUE_ORDER).toList();
        for (DesignPhase job : rest) {
            job.setQueuePosition(position++);
        }
        jobRepository.saveAll(jobs);
        List<DesignPhase> ordered = jobs.stream().filter(j -> !CLOSED.contains(status(j))).sorted(QUEUE_ORDER).toList();
        return ApiResponse.success("Order saved", toDtos(ordered));
    }

    @Override
    public ApiResponse<DesignJobDto> requestRedesign(Long jobId, DesignRedesignRequest request, Long adminId,
                                                     String adminName) {
        DesignPhase job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            return ApiResponse.error("Design job not found");
        }
        if (!APPROVED_STATES.contains(status(job))) {
            return ApiResponse.error("Only an approved design can be sent for redesign");
        }
        if (request.getNote() == null || request.getNote().isBlank()) {
            return ApiResponse.error("Say what needs to change");
        }
        User designer = request.getDesignerId() == null ? null : userRepository.findById(request.getDesignerId()).orElse(null);
        String designerError = validateDesigner(designer);
        if (designerError != null) {
            return ApiResponse.error(designerError);
        }
        String priority = normalizePriority(request.getPriority());
        if (request.getPriority() != null && !request.getPriority().isBlank() && priority == null) {
            return ApiResponse.error("Priority must be Low, Medium, High or Urgent");
        }
        String note = request.getNote().trim();
        startNextVersion(job, designer, note, request.getDueDate(), priority, adminId);
        // The request is also the first line of the new round's conversation.
        saveNote(job, note, adminId, adminName, false);
        job.setAdminNotesSeenAt(LocalDateTime.now());
        jobRepository.save(job);

        Customer customer = job.getCustomer();
        boolean moved = false;
        if (customer != null && !REDESIGN_KEEPS_STAGE.contains(customer.getStatus())) {
            moved = moveCustomer(customer, CustomerStatus.DESIGN_STAGE, adminName,
                    "Redesign requested (V" + version(job) + "): " + note);
        }
        return ApiResponse.success(moved
                ? "Redesign requested — customer moved back to Design Stage"
                : "Redesign requested", detail(job));
    }

    // ------------------------------------------------------------------ designer actions

    @Override
    public ApiResponse<DesignJobDto> start(Long jobId, Long callerId) {
        DesignPhase job = jobRepository.findById(jobId).orElse(null);
        if (job == null || !isAssignedDesigner(job, callerId)) {
            return ApiResponse.error("Design job not found");
        }
        if (status(job) != DesignStatus.PLANNING && status(job) != DesignStatus.REVISION_REQUIRED) {
            return ApiResponse.error("This design is already started");
        }
        job.setDesignStatus(DesignStatus.IN_PROGRESS);
        if (job.getStartedAt() == null) {
            job.setStartedAt(LocalDateTime.now());
        }
        job.setDesignerSeenAt(LocalDateTime.now());
        jobRepository.save(job);
        return ApiResponse.success("Design started", detail(job));
    }

    @Override
    public ApiResponse<DesignJobDto> complete(Long jobId, String message, Long callerId, String callerName) {
        DesignPhase job = jobRepository.findById(jobId).orElse(null);
        if (job == null || !isAssignedDesigner(job, callerId)) {
            return ApiResponse.error("Design job not found");
        }
        if (!DESIGNER_WORK.contains(status(job))) {
            return ApiResponse.error("Only a design that is waiting, in progress or needs changes can be completed");
        }
        int version = version(job);
        // Extras (a brief, a zip) may sit next to it, but there has to be a design to look at.
        boolean hasDesign = fileRepository.findByDesignPhaseId(job.getId()).stream()
                .anyMatch(f -> isDesignFile(f) && versionOf(f) == version
                        && DesignFileTypes.isDesign(f.getOriginalFileName()));
        if (!hasDesign) {
            return ApiResponse.error("Upload the design — " + DesignFileTypes.DESIGN_KINDS
                    + " — before marking it complete");
        }
        LocalDateTime now = LocalDateTime.now();
        job.setDesignStatus(DesignStatus.PENDING_SUPERADMIN_APPROVAL);
        if (job.getStartedAt() == null) {
            job.setStartedAt(now);
        }
        job.setCompletedAt(now);
        job.setCompletionSeenAt(null); // news for admin
        job.setDesignerSeenAt(now);
        if (message != null && !message.isBlank()) {
            saveNote(job, message, callerId, callerName, true);
            job.setDesignerNotesSeenAt(now);
        }
        jobRepository.save(job);
        DesignPhaseVersion row = currentVersionRow(job);
        row.setCompletedAt(now);
        versionRepository.save(row);
        return ApiResponse.success("Design sent to admin for review", detail(job));
    }

    @Override
    public ApiResponse<DesignJobDto> review(Long jobId, DesignReviewRequest request, Long adminId, String adminName) {
        DesignPhase job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            return ApiResponse.error("Design job not found");
        }
        String decision = request.getDecision() == null ? "" : request.getDecision().trim().toUpperCase();
        boolean hasNote = request.getNote() != null && !request.getNote().isBlank();
        if (!"APPROVE".equals(decision) && !"CHANGES".equals(decision)) {
            return ApiResponse.error("Decision must be APPROVE or CHANGES");
        }
        if (status(job) != DesignStatus.PENDING_SUPERADMIN_APPROVAL) {
            return ApiResponse.error("This design is not waiting for review");
        }
        if ("CHANGES".equals(decision) && !hasNote) {
            return ApiResponse.error("Say what needs to change");
        }
        LocalDateTime now = LocalDateTime.now();
        boolean approve = "APPROVE".equals(decision);
        if (approve) {
            job.setDesignStatus(DesignStatus.APPROVED_BY_ADMIN);
            DesignPhaseVersion row = currentVersionRow(job);
            row.setApprovedAt(now);
            row.setApprovedByUserId(adminId);
            row.setApprovedByName(adminName);
            versionRepository.save(row);
        } else {
            // Same version, another round: it is not approved yet.
            job.setDesignStatus(DesignStatus.REVISION_REQUIRED);
            job.setRevisionCount(nz(job.getRevisionCount()) + 1);
        }
        job.setCompletionSeenAt(now);
        job.setDesignerSeenAt(null); // news for the designer either way
        if (hasNote) {
            saveNote(job, request.getNote(), adminId, adminName, false);
            job.setAdminNotesSeenAt(now);
        }
        jobRepository.save(job);
        if (!approve) {
            return ApiResponse.success("Changes requested", detail(job));
        }
        boolean moved = moveToQuotationIfInDesign(job.getCustomer(), adminName,
                "Design V" + version(job) + " approved" + (hasNote ? ": " + request.getNote().trim() : ""));
        return ApiResponse.success(moved ? "Design approved — customer moved to Quotation Stage" : "Design approved",
                detail(job));
    }

    @Override
    public ApiResponse<DesignJobDto> addNote(Long jobId, String message, Long callerId, String callerName, boolean admin) {
        DesignPhase job = jobRepository.findById(jobId).orElse(null);
        if (job == null || !canAccess(job, callerId, admin)) {
            return ApiResponse.error("Design job not found");
        }
        if (message == null || message.isBlank()) {
            return ApiResponse.error("Type a note first");
        }
        if (message.trim().length() > 2000) {
            return ApiResponse.error("Notes are limited to 2000 characters");
        }
        boolean fromDesigner = isAssignedDesigner(job, callerId);
        saveNote(job, message, callerId, callerName, fromDesigner);
        // Writing in the thread means you have read it.
        LocalDateTime now = LocalDateTime.now();
        if (fromDesigner) {
            job.setDesignerNotesSeenAt(now);
        } else {
            job.setAdminNotesSeenAt(now);
        }
        jobRepository.save(job);
        return ApiResponse.success("Note added", detail(job));
    }

    @Override
    public ApiResponse<DesignJobDto> markSeen(Long jobId, Long callerId, boolean admin) {
        DesignPhase job = jobRepository.findById(jobId).orElse(null);
        if (job == null || !canAccess(job, callerId, admin)) {
            return ApiResponse.error("Design job not found");
        }
        LocalDateTime now = LocalDateTime.now();
        if (isAssignedDesigner(job, callerId)) {
            job.setDesignerSeenAt(now);
            job.setDesignerNotesSeenAt(now);
        }
        if (admin) {
            job.setAdminNotesSeenAt(now);
            if (status(job) == DesignStatus.PENDING_SUPERADMIN_APPROVAL && job.getCompletionSeenAt() == null) {
                job.setCompletionSeenAt(now);
            }
        }
        jobRepository.save(job);
        return ApiResponse.success(detail(job));
    }

    // ------------------------------------------------------------------ files

    @Override
    public ApiResponse<DesignJobDto> uploadFile(Long jobId, MultipartFile file, String description, Long callerId,
                                                String callerName, boolean admin, boolean coordinator) {
        DesignPhase job = jobRepository.findById(jobId).orElse(null);
        boolean own = job != null && isAssignedDesigner(job, callerId);
        if (job == null || !(admin || own || coordinator)) {
            return ApiResponse.error("Design job not found");
        }
        if (file == null || file.isEmpty()) {
            return ApiResponse.error("Choose a file to upload");
        }
        if (!OPEN.contains(status(job))) {
            return ApiResponse.error(status(job) == DesignStatus.CANCELLED
                    ? "This design is cancelled"
                    : "This version is approved. A redesign opens the next version for new files.");
        }
        if (!admin && !own && !DESIGNER_WORK.contains(status(job))) {
            // Handed in: what happens to it now is the admin's decision.
            return ApiResponse.error("This design is waiting for the admin's approval");
        }
        ApiResponse<DesignPhaseFileDto> stored = store(job, file, DesignPhaseFile.FileCategory.DESIGN, description, callerName);
        if (!Boolean.TRUE.equals(stored.getSuccess())) {
            return ApiResponse.error(stored.getMessage());
        }
        DesignJobDto dto = detail(job);
        return ApiResponse.success("File uploaded", admin || own ? dto : withoutConversation(dto));
    }

    @Override
    public ApiResponse<DesignJobDto> uploadPlanDocuments(Long jobId, MultipartFile[] files, String callerName,
                                                         boolean admin) {
        DesignPhase job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            return ApiResponse.error("Design job not found");
        }
        List<MultipartFile> picked = files == null ? List.of()
                : Arrays.stream(files).filter(f -> f != null && !f.isEmpty()).toList();
        if (picked.isEmpty()) {
            return ApiResponse.error("Choose the plan documents to add");
        }
        for (MultipartFile file : picked) {
            ApiResponse<DesignPhaseFileDto> stored = store(job, file, DesignPhaseFile.FileCategory.PLAN, null, callerName);
            if (!Boolean.TRUE.equals(stored.getSuccess())) {
                // All or nothing: a half-attached set would look complete to the designer.
                TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                return ApiResponse.error(file.getOriginalFilename() + ": " + stored.getMessage());
            }
        }
        if (job.getStaffAssigned() != null) {
            job.setDesignerSeenAt(null); // news for the designer
        }
        jobRepository.save(job);
        DesignJobDto dto = detail(job);
        return ApiResponse.success(picked.size() == 1 ? "Plan document added" : picked.size() + " plan documents added",
                admin ? dto : withoutConversation(dto));
    }

    @Override
    public ApiResponse<DesignJobDto> uploadCustomerPlanDocuments(Long customerId, MultipartFile[] files, Long callerId,
                                                                 String callerName, boolean admin) {
        Customer customer = customerRepository.findById(customerId).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }
        DesignPhase job = latestJob(customerId);
        if (job == null) {
            if (customer.getStatus() != CustomerStatus.DESIGN_STAGE) {
                return ApiResponse.error("Move the customer to Design Stage first");
            }
            if (files == null || Arrays.stream(files).noneMatch(f -> f != null && !f.isEmpty())) {
                return ApiResponse.error("Choose the plan documents to add");
            }
            // Nobody has been given this design yet. It is kept as version 1 without a designer: the
            // customer stays under "To assign", and whoever is chosen finds the documents there.
            // A document that is refused below takes this back with it (one transaction).
            job = newJob(customer);
            jobRepository.save(job);
            newVersionRow(job, DesignPhaseVersion.ORIGIN_DESIGNER, null, callerId, callerName);
        }
        return uploadPlanDocuments(job.getId(), files, callerName, admin);
    }

    @Override
    public ApiResponse<DesignJobDto> deleteFile(Long jobId, Long fileId, Long callerId, boolean admin,
                                                boolean coordinator) {
        DesignPhase job = jobRepository.findById(jobId).orElse(null);
        boolean own = job != null && isAssignedDesigner(job, callerId);
        if (job == null || !(admin || coordinator || own)) {
            return ApiResponse.error("Design job not found");
        }
        DesignPhaseFile file = fileRepository.findById(fileId).orElse(null);
        if (file == null || file.getDesignPhase() == null || !file.getDesignPhase().getId().equals(job.getId())) {
            return ApiResponse.error("File not found");
        }
        if (!isDesignFile(file)) {
            if (!admin && !coordinator) {
                return ApiResponse.error("Only the admin or admin staff can remove plan documents");
            }
        } else {
            // A design file can be taken back only while its version is still being worked on: by
            // the admin, the designer who has it, or admin staff.
            if (versionOf(file) != version(job) || !OPEN.contains(status(job))) {
                return ApiResponse.error("Files of an approved version cannot be removed");
            }
            if (!admin && !DESIGNER_WORK.contains(status(job))) {
                return ApiResponse.error("This design is with the admin for review");
            }
        }
        ApiResponse<String> deleted = fileService.deleteFile(fileId);
        if (!Boolean.TRUE.equals(deleted.getSuccess())) {
            return ApiResponse.error(deleted.getMessage());
        }
        DesignJobDto dto = detail(job);
        return ApiResponse.success("File removed", admin || own ? dto : withoutConversation(dto));
    }

    @Override
    public ApiResponse<DesignJobDto> uploadCustomerDesign(Long customerId, MultipartFile[] files, String note,
                                                          boolean moveToQuotation, Long callerId, String callerName,
                                                          boolean admin, boolean coordinator) {
        Customer customer = customerRepository.findById(customerId).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }
        List<MultipartFile> picked = files == null ? List.of()
                : Arrays.stream(files).filter(f -> f != null && !f.isEmpty()).toList();
        if (picked.isEmpty()) {
            return ApiResponse.error("Choose the design file");
        }
        // Every file is checked before the first is stored: a design is saved whole or not at all.
        for (MultipartFile file : picked) {
            String problem = !DesignFileTypes.isDesign(file.getOriginalFilename())
                    ? "The design must be " + DesignFileTypes.DESIGN_KINDS
                    : fileService.checkFile(file);
            if (problem != null) {
                return ApiResponse.error(picked.size() == 1 ? problem : file.getOriginalFilename() + ": " + problem);
            }
        }
        boolean hasNote = note != null && !note.isBlank();
        if (moveToQuotation && !hasNote) {
            return ApiResponse.error("Write a note for the status change");
        }
        DesignPhase existing = latestJob(customerId);
        boolean open = existing != null && OPEN.contains(status(existing));
        // A design nobody has been given yet (it holds plan documents at most) is nobody's work.
        boolean withSomeone = open && existing.getStaffAssigned() != null;
        if (withSomeone && !admin) {
            // While the designer has it, admin staff may bring in the finished design. Once it is
            // handed in for approval the decision is the admin's.
            if (!coordinator) {
                return ApiResponse.error("The design is still with " + existing.getStaffAssigned().getName()
                        + ". The admin approves it from Designs.");
            }
            if (!DESIGNER_WORK.contains(status(existing))) {
                return ApiResponse.error("This design is waiting for the admin's approval");
            }
        }
        // Valid — now write.
        LocalDateTime now = LocalDateTime.now();
        DesignPhase job;
        DesignPhaseVersion row;
        if (existing == null) {
            // The customer's design was made outside the system: it is version 1, approved as it is.
            job = newJob(customer);
            jobRepository.save(job);
            row = newVersionRow(job, DesignPhaseVersion.ORIGIN_UPLOADED, hasNote ? note.trim() : null, callerId, callerName);
        } else if (APPROVED_STATES.contains(status(existing))) {
            // A newer design replaces the approved one as the next version.
            job = existing;
            DesignPhaseVersion previous = currentVersionRow(job);
            if (previous.getApprovedAt() == null) {
                previous.setApprovedAt(job.getCompletedAt() != null ? job.getCompletedAt() : now);
                versionRepository.save(previous);
            }
            job.setCurrentVersion(version(job) + 1);
            jobRepository.save(job);
            row = newVersionRow(job, DesignPhaseVersion.ORIGIN_UPLOADED, hasNote ? note.trim() : null, callerId, callerName);
        } else {
            // Open (closed with these files) or cancelled: the upload settles the current version.
            // It stays the designer's version only when a designer had it.
            job = existing;
            row = currentVersionRow(job);
            if (!withSomeone) {
                row.setOrigin(DesignPhaseVersion.ORIGIN_UPLOADED);
            }
        }
        for (MultipartFile file : picked) {
            ApiResponse<DesignPhaseFileDto> stored = store(job, file, DesignPhaseFile.FileCategory.DESIGN, null, callerName);
            if (!Boolean.TRUE.equals(stored.getSuccess())) {
                TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                return ApiResponse.error(picked.size() == 1
                        ? stored.getMessage() : file.getOriginalFilename() + ": " + stored.getMessage());
            }
        }
        job.setDesignStatus(DesignStatus.APPROVED_BY_ADMIN);
        if (job.getCompletedAt() == null || !open) {
            job.setCompletedAt(now);
        }
        job.setCompletionSeenAt(now);
        if (open && job.getStaffAssigned() != null) {
            job.setDesignerSeenAt(null); // their design was settled without them: that is news
        }
        jobRepository.save(job);
        if (row.getCompletedAt() == null) {
            row.setCompletedAt(now);
        }
        row.setApprovedAt(now);
        row.setApprovedByUserId(callerId);
        row.setApprovedByName(callerName);
        versionRepository.save(row);

        String message = "Design saved";
        if (moveToQuotation) {
            if (moveCustomer(customer, CustomerStatus.QUOTE_GIVEN, callerName, note.trim())) {
                message = "Design saved — customer moved to Quotation Stage";
            }
        } else if (moveToQuotationIfInDesign(customer, callerName, "Design V" + version(job) + " uploaded")) {
            message = "Design saved — customer moved to Quotation Stage";
        }
        return ApiResponse.success(message, detail(job));
    }

    // ------------------------------------------------------------------ designers panel

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<DesignerSummaryDto>> designers() {
        List<User> designers = userRepository.findAll().stream()
                .filter(u -> STAFF_TYPE_DESIGNER.equals(u.getStaffType()) && !Boolean.FALSE.equals(u.getActive()))
                .sorted(Comparator.comparing(u -> u.getName() == null ? "" : u.getName().toLowerCase()))
                .toList();
        Map<Long, List<DesignPhase>> jobsByDesigner = jobRepository.findAllWithPeople().stream()
                .filter(d -> d.getStaffAssigned() != null)
                .collect(Collectors.groupingBy(d -> d.getStaffAssigned().getId()));
        List<DesignerSummaryDto> out = new ArrayList<>();
        for (User u : designers) {
            out.add(summary(u, jobsByDesigner.getOrDefault(u.getId(), List.of())));
        }
        return ApiResponse.success(out);
    }

    @Override
    public ApiResponse<DesignerSummaryDto> setDesignerStatus(Long userId, String status) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !STAFF_TYPE_DESIGNER.equals(user.getStaffType())) {
            return ApiResponse.error("Designer not found");
        }
        if (status == null || status.isBlank()) {
            user.setDesignerStatus(null);
        } else {
            String v = status.trim().toUpperCase().replace(' ', '_');
            if (!DESIGNER_STATUSES.contains(v)) {
                return ApiResponse.error("Status must be Available, Busy or On leave");
            }
            user.setDesignerStatus(v);
        }
        userRepository.save(user);
        return ApiResponse.success("Designer status updated", summary(user, jobRepository.findByDesigner(userId)));
    }

    // ------------------------------------------------------------------ bells

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Object>> myFeed(Long designerId) {
        if (designerId == null) {
            return ApiResponse.success(feed(List.of()));
        }
        List<DesignPhase> open = jobRepository.findByDesigner(designerId).stream()
                .filter(d -> !CLOSED.contains(status(d)) || d.getDesignerSeenAt() == null)
                .sorted(QUEUE_ORDER)
                .toList();
        List<DesignJobDto> dtos = toDtos(open);
        LocalDate today = today();
        List<DesignJobDto> news = dtos.stream().filter(d ->
                Boolean.TRUE.equals(d.getNewForDesigner())
                        || nz(d.getUnreadForDesigner()) > 0
                        || (isDesignerWork(d.getStatus()) && d.getDueDate() != null && !d.getDueDate().isAfter(today))
        ).toList();
        return ApiResponse.success(feed(news));
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Object>> attention() {
        List<DesignJobDto> dtos = toDtos(jobRepository.findAllWithPeople().stream()
                .filter(d -> status(d) != DesignStatus.CANCELLED)
                .sorted(Comparator.comparing(DesignPhase::getId).reversed())
                .toList());
        List<DesignJobDto> news = dtos.stream().filter(d ->
                Boolean.TRUE.equals(d.getNewForAdmin())
                        || nz(d.getUnreadForAdmin()) > 0
                        || Boolean.TRUE.equals(d.getOverdue())
        ).toList();
        return ApiResponse.success(feed(news));
    }

    @Override
    public ApiResponse<Integer> markAllMineSeen(Long designerId) {
        if (designerId == null) {
            return ApiResponse.success(0);
        }
        int n = 0;
        LocalDateTime now = LocalDateTime.now();
        List<DesignPhase> jobs = jobRepository.findByDesigner(designerId);
        for (DesignPhase job : jobs) {
            if (job.getDesignerSeenAt() == null) {
                job.setDesignerSeenAt(now);
                n++;
            }
        }
        jobRepository.saveAll(jobs);
        return ApiResponse.success(n);
    }

    // ------------------------------------------------------------------ helpers

    /** Queue order: explicit position first (nulls last), then oldest assignment. */
    private static final Comparator<DesignPhase> QUEUE_ORDER = Comparator
            .comparing((DesignPhase d) -> d.getQueuePosition() == null ? Integer.MAX_VALUE : d.getQueuePosition())
            .thenComparing(d -> d.getAssignedAt() == null ? LocalDateTime.MAX : d.getAssignedAt())
            .thenComparing(DesignPhase::getId);

    private static DesignStatus status(DesignPhase d) {
        return d.getDesignStatus() == null ? DesignStatus.PLANNING : d.getDesignStatus();
    }

    /** Designs older than V155 have no version number: they are version 1. */
    private static int version(DesignPhase d) {
        return d.getCurrentVersion() == null ? 1 : d.getCurrentVersion();
    }

    private static int versionOf(DesignPhaseFile f) {
        return f.getVersionNo() == null ? 1 : f.getVersionNo();
    }

    /** Everything that is not a plan document is the designer's (or the uploaded) design. */
    private static boolean isDesignFile(DesignPhaseFile f) {
        return f.getFileCategory() != DesignPhaseFile.FileCategory.PLAN;
    }

    private static boolean isDesignerWork(String status) {
        try {
            return status != null && DESIGNER_WORK.contains(DesignStatus.valueOf(status));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static int nz(Integer v) {
        return v == null ? 0 : v;
    }

    private String userName(Long userId) {
        return userId == null ? null : userRepository.findById(userId).map(User::getName).orElse(null);
    }

    private DesignPhase latestJob(Long customerId) {
        List<DesignPhase> jobs = jobRepository.findByCustomerNewestFirst(customerId);
        return jobs.isEmpty() ? null : jobs.get(0);
    }

    private DesignPhase newJob(Customer customer) {
        DesignPhase job = new DesignPhase();
        job.setCustomer(customer);
        job.setDesignStatus(DesignStatus.PLANNING);
        job.setRevisionCount(0);
        job.setCurrentVersion(1);
        return job;
    }

    /** A fresh row for the job's current version. The job must already be saved. */
    private DesignPhaseVersion newVersionRow(DesignPhase job, String origin, String requestNote, Long byUserId,
                                             String byName) {
        DesignPhaseVersion row = new DesignPhaseVersion();
        row.setDesignPhase(job);
        row.setVersionNo(version(job));
        row.setOrigin(origin);
        row.setRequestNote(requestNote);
        row.setRequestedByUserId(byUserId);
        row.setRequestedByName(byName);
        row.setRequestedAt(LocalDateTime.now());
        return versionRepository.save(row);
    }

    /**
     * The row of the job's current version. Designs made before V155 got theirs from the
     * migration; one the previous jar created during a rollback has none, so it is built here
     * from what the job itself knows.
     */
    private DesignPhaseVersion currentVersionRow(DesignPhase job) {
        return versionRepository.findVersion(job.getId(), version(job)).orElseGet(() -> {
            DesignPhaseVersion row = new DesignPhaseVersion();
            row.setDesignPhase(job);
            row.setVersionNo(version(job));
            row.setOrigin(DesignPhaseVersion.ORIGIN_DESIGNER);
            if (job.getStaffAssigned() != null) {
                row.setDesignerUserId(job.getStaffAssigned().getId());
                row.setDesignerName(job.getStaffAssigned().getName());
            }
            row.setRequestNote(job.getDesignRequirements());
            row.setRequestedByUserId(job.getAssignedByUserId());
            row.setRequestedAt(job.getAssignedAt() != null ? job.getAssignedAt() : LocalDateTime.now());
            row.setCompletedAt(job.getCompletedAt());
            return versionRepository.save(row);
        });
    }

    /** Reopens an approved design as its next version, in the given designer's queue. */
    private void startNextVersion(DesignPhase job, User designer, String note, LocalDate dueDate, String priority,
                                  Long byUserId) {
        DesignPhaseVersion previous = currentVersionRow(job);
        if (previous.getApprovedAt() == null) {
            previous.setApprovedAt(job.getCompletedAt() != null ? job.getCompletedAt() : LocalDateTime.now());
            versionRepository.save(previous);
        }
        job.setCurrentVersion(version(job) + 1);
        assignTo(job, designer, byUserId);
        job.setDesignStatus(DesignStatus.PLANNING);
        job.setStartedAt(null);
        job.setCompletedAt(null);
        job.setCompletionSeenAt(null);
        job.setDueDate(dueDate); // a new round gets its own date, or none
        if (priority != null) {
            job.setPriority(priority);
        }
        // The brief of a redesign is what has to change.
        job.setDesignRequirements(note == null || note.isBlank() ? null : note.trim());
        jobRepository.save(job);
        DesignPhaseVersion row = newVersionRow(job, DesignPhaseVersion.ORIGIN_DESIGNER, job.getDesignRequirements(),
                byUserId, userName(byUserId));
        row.setDesignerUserId(designer.getId());
        row.setDesignerName(designer.getName());
        versionRepository.save(row);
    }

    /** Put the job at the end of the designer's queue and make it news for them. */
    private void assignTo(DesignPhase job, User designer, Long byUserId) {
        job.setStaffAssigned(designer);
        Integer max = jobRepository.maxQueuePosition(designer.getId());
        job.setQueuePosition((max == null ? 0 : max) + 1);
        job.setAssignedAt(LocalDateTime.now());
        job.setAssignedByUserId(byUserId);
        job.setDesignerSeenAt(null);
    }

    /**
     * Changes the customer's stage and writes the timeline entry, exactly as a manual status change
     * does. Returns false when the customer is already there.
     */
    private boolean moveCustomer(Customer customer, CustomerStatus to, String changedBy, String reason) {
        if (customer == null || customer.getStatus() == to) {
            return false;
        }
        String previous = customer.getStatus() != null ? customer.getStatus().name() : null;
        customer.setStatus(to);
        customerRepository.save(customer);
        WorkflowHistory history = new WorkflowHistory();
        history.setCustomer(customer);
        history.setPreviousState(previous);
        history.setNewState(to.name());
        history.setChangedBy(changedBy != null && !changedBy.isBlank() ? changedBy : "System");
        history.setChangeReason(reason);
        history.setTimestamp(LocalDateTime.now());
        workflowHistoryRepository.save(history);
        return true;
    }

    /** An approved design ends the Design stage: the customer goes on to Quotation Stage. */
    private boolean moveToQuotationIfInDesign(Customer customer, String changedBy, String reason) {
        return customer != null && customer.getStatus() == CustomerStatus.DESIGN_STAGE
                && moveCustomer(customer, CustomerStatus.QUOTE_GIVEN, changedBy, reason);
    }

    private ApiResponse<DesignPhaseFileDto> store(DesignPhase job, MultipartFile file, DesignPhaseFile.FileCategory category,
                                                  String description, String uploadedBy) {
        DesignFileUploadRequest request = new DesignFileUploadRequest();
        request.setDesignPhaseId(job.getId());
        request.setFileCategory(category);
        request.setDescription(description);
        request.setVersionNo(version(job));
        return fileService.uploadDesignFile(file, request, uploadedBy);
    }

    private static String validateDesigner(User designer) {
        if (designer == null) {
            return "Designer not found";
        }
        if (Boolean.FALSE.equals(designer.getActive())) {
            return designer.getName() + " is not active";
        }
        if (!STAFF_TYPE_DESIGNER.equals(designer.getStaffType())) {
            return designer.getName() + " is not a Designer — set their staff type to Designer first";
        }
        return null;
    }

    private static String normalizePriority(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String v = raw.trim().toUpperCase();
        return PRIORITIES.contains(v) ? v : null;
    }

    private static boolean isAssignedDesigner(DesignPhase job, Long userId) {
        return userId != null && job.getStaffAssigned() != null && job.getStaffAssigned().getId().equals(userId);
    }

    private static boolean canAccess(DesignPhase job, Long userId, boolean admin) {
        return admin || isAssignedDesigner(job, userId);
    }

    private void saveNote(DesignPhase job, String message, Long authorId, String authorName, boolean fromDesigner) {
        DesignPhaseNote note = new DesignPhaseNote();
        note.setDesignPhase(job);
        note.setAuthorUserId(authorId);
        note.setAuthorName(authorName);
        note.setFromDesigner(fromDesigner);
        note.setMessage(message.trim());
        note.setCreatedAt(LocalDateTime.now());
        note.setVersionNo(version(job));
        noteRepository.save(note);
    }

    private Map<String, Object> feed(List<DesignJobDto> jobs) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("count", jobs.size());
        payload.put("jobs", jobs);
        return payload;
    }

    private DesignerSummaryDto summary(User u, List<DesignPhase> jobs) {
        LocalDate today = today();
        int waiting = 0, inProgress = 0, changes = 0, review = 0, overdue = 0;
        for (DesignPhase d : jobs) {
            DesignStatus s = status(d);
            if (s == DesignStatus.PLANNING) waiting++;
            if (s == DesignStatus.IN_PROGRESS) inProgress++;
            if (s == DesignStatus.REVISION_REQUIRED) changes++;
            if (s == DesignStatus.PENDING_SUPERADMIN_APPROVAL) review++;
            if (DESIGNER_WORK.contains(s) && d.getDueDate() != null && d.getDueDate().isBefore(today)) overdue++;
        }
        DesignPhase current = jobs.stream().filter(d -> status(d) == DesignStatus.IN_PROGRESS).sorted(QUEUE_ORDER).findFirst()
                .orElse(jobs.stream().filter(d -> DESIGNER_WORK.contains(status(d))).sorted(QUEUE_ORDER).findFirst().orElse(null));
        DesignerSummaryDto dto = new DesignerSummaryDto();
        dto.setId(u.getId());
        dto.setName(u.getName());
        dto.setDesignerStatus(u.getDesignerStatus());
        dto.setWaiting(waiting);
        dto.setInProgress(inProgress);
        dto.setChangesRequested(changes);
        dto.setAwaitingReview(review);
        dto.setOverdue(overdue);
        dto.setActiveCount(waiting + inProgress + changes);
        if (current != null) {
            dto.setCurrentJobId(current.getId());
            dto.setCurrentCustomerName(current.getCustomer() != null ? current.getCustomer().getName() : null);
        }
        return dto;
    }

    /** The customer page and the library show the design, not the admin <-> designer thread. */
    private static DesignJobDto withoutConversation(DesignJobDto dto) {
        dto.setNotes(null);
        dto.setLatestNote(null);
        dto.setNoteCount(0);
        dto.setUnreadForAdmin(0);
        dto.setUnreadForDesigner(0);
        return dto;
    }

    /** Summary plus the files: current design files, plan documents and every version's own files. */
    private DesignJobDto detail(DesignPhase job) {
        DesignJobDto dto = toDtos(List.of(job)).get(0);
        int version = version(job);
        List<DesignPhaseFile> files = fileRepository.findByDesignPhaseId(job.getId());
        dto.setFiles(files.stream()
                .filter(f -> isDesignFile(f) && versionOf(f) == version)
                .map(DesignJobServiceImpl::fileDto)
                .toList());
        dto.setPlanDocuments(files.stream()
                .filter(f -> !isDesignFile(f))
                .sorted(Comparator.<DesignPhaseFile, Integer>comparing(DesignJobServiceImpl::versionOf).reversed()
                        .thenComparing(DesignPhaseFile::getId))
                .map(DesignJobServiceImpl::fileDto)
                .toList());
        List<DesignVersionDto> versions = new ArrayList<>();
        for (DesignPhaseVersion row : versionRepository.findForJobs(List.of(job.getId()))) {
            DesignVersionDto v = new DesignVersionDto();
            v.setVersionNo(row.getVersionNo());
            v.setOrigin(row.getOrigin());
            v.setDesignerName(row.getDesignerName());
            v.setRequestNote(row.getRequestNote());
            v.setRequestedByName(row.getRequestedByName());
            v.setRequestedAt(row.getRequestedAt());
            v.setCompletedAt(row.getCompletedAt());
            v.setApprovedAt(row.getApprovedAt());
            v.setApprovedByName(row.getApprovedByName());
            v.setFiles(files.stream()
                    .filter(f -> isDesignFile(f) && versionOf(f) == row.getVersionNo())
                    .map(DesignJobServiceImpl::fileDto)
                    .toList());
            versions.add(v);
        }
        dto.setVersions(versions);
        return dto;
    }

    private static DesignPhaseFileDto fileDto(DesignPhaseFile f) {
        DesignPhaseFileDto dto = new DesignPhaseFileDto();
        dto.setId(f.getId());
        dto.setDesignPhaseId(f.getDesignPhase() != null ? f.getDesignPhase().getId() : null);
        dto.setFileName(f.getFileName());
        dto.setOriginalFileName(f.getOriginalFileName());
        dto.setFileUrl(f.getFileUrl());
        dto.setFileSize(f.getFileSize());
        dto.setFileType(f.getFileType());
        dto.setFileCategory(f.getFileCategory());
        dto.setDescription(f.getDescription());
        dto.setUploadedBy(f.getUploadedBy());
        dto.setVersionNo(versionOf(f));
        dto.setCreatedAt(f.getCreatedAt());
        dto.setUpdatedAt(f.getUpdatedAt());
        return dto;
    }

    /** Batch conversion: one query each for notes, files and versions. Notes are attached in full. */
    private List<DesignJobDto> toDtos(List<DesignPhase> jobs) {
        if (jobs.isEmpty()) {
            return new ArrayList<>();
        }
        List<Long> ids = jobs.stream().map(DesignPhase::getId).filter(Objects::nonNull).toList();
        Map<Long, List<DesignPhaseNote>> notesByJob = new HashMap<>();
        Map<Long, List<DesignPhaseFile>> filesByJob = new HashMap<>();
        Map<Long, List<DesignPhaseVersion>> versionsByJob = new HashMap<>();
        if (!ids.isEmpty()) {
            for (DesignPhaseNote n : noteRepository.findForJobs(ids)) {
                notesByJob.computeIfAbsent(n.getDesignPhase().getId(), k -> new ArrayList<>()).add(n);
            }
            for (DesignPhaseFile f : fileRepository.findForDesignPhases(ids)) {
                filesByJob.computeIfAbsent(f.getDesignPhase().getId(), k -> new ArrayList<>()).add(f);
            }
            for (DesignPhaseVersion v : versionRepository.findForJobs(ids)) {
                versionsByJob.computeIfAbsent(v.getDesignPhase().getId(), k -> new ArrayList<>()).add(v);
            }
        }
        LocalDate today = today();
        List<DesignJobDto> out = new ArrayList<>(jobs.size());
        for (DesignPhase d : jobs) {
            out.add(toDto(d, notesByJob.getOrDefault(d.getId(), List.of()), filesByJob.getOrDefault(d.getId(), List.of()),
                    versionsByJob.getOrDefault(d.getId(), List.of()), today));
        }
        return out;
    }

    private DesignJobDto toDto(DesignPhase d, List<DesignPhaseNote> notes, List<DesignPhaseFile> files,
                               List<DesignPhaseVersion> versions, LocalDate today) {
        DesignStatus s = status(d);
        int version = version(d);
        DesignJobDto dto = new DesignJobDto();
        dto.setId(d.getId());
        if (d.getCustomer() != null) {
            dto.setCustomerId(d.getCustomer().getId());
            dto.setCustomerName(d.getCustomer().getName());
            dto.setCustomerPlace(d.getCustomer().getPlace());
            dto.setCustomerStatus(d.getCustomer().getStatus() != null ? d.getCustomer().getStatus().name() : null);
        }
        if (d.getStaffAssigned() != null) {
            dto.setDesignerId(d.getStaffAssigned().getId());
            dto.setDesignerName(d.getStaffAssigned().getName());
        }
        dto.setStatus(s.name());
        dto.setVersion(version);
        DesignPhaseVersion current = versions.stream()
                .filter(v -> v.getVersionNo() != null && v.getVersionNo() == version).findFirst().orElse(null);
        dto.setOrigin(current != null ? current.getOrigin() : DesignPhaseVersion.ORIGIN_DESIGNER);
        if (current != null) {
            dto.setApprovedAt(current.getApprovedAt());
            dto.setApprovedByName(current.getApprovedByName());
        }
        dto.setQueuePosition(d.getQueuePosition());
        dto.setDueDate(d.getDueDate());
        dto.setPriority(d.getPriority() == null ? "MEDIUM" : d.getPriority());
        dto.setBrief(d.getDesignRequirements());
        dto.setRevisionCount(nz(d.getRevisionCount()));
        dto.setAssignedAt(d.getAssignedAt());
        dto.setStartedAt(d.getStartedAt());
        dto.setCompletedAt(d.getCompletedAt());
        dto.setCompletionSeenAt(d.getCompletionSeenAt());
        dto.setUpdatedAt(d.getUpdatedAt());
        dto.setOverdue(DESIGNER_WORK.contains(s) && d.getDueDate() != null && d.getDueDate().isBefore(today));
        dto.setNewForDesigner(d.getStaffAssigned() != null && d.getDesignerSeenAt() == null);
        dto.setNewForAdmin(s == DesignStatus.PENDING_SUPERADMIN_APPROVAL && d.getCompletionSeenAt() == null);

        int unreadForAdmin = 0, unreadForDesigner = 0;
        List<DesignNoteDto> noteDtos = new ArrayList<>(notes.size());
        for (DesignPhaseNote n : notes) {
            boolean fromDesigner = Boolean.TRUE.equals(n.getFromDesigner());
            if (fromDesigner && after(n.getCreatedAt(), d.getAdminNotesSeenAt())) unreadForAdmin++;
            if (!fromDesigner && after(n.getCreatedAt(), d.getDesignerNotesSeenAt())) unreadForDesigner++;
            DesignNoteDto nd = new DesignNoteDto();
            nd.setId(n.getId());
            nd.setAuthorUserId(n.getAuthorUserId());
            nd.setAuthorName(n.getAuthorName());
            nd.setFromDesigner(fromDesigner);
            nd.setMessage(n.getMessage());
            nd.setCreatedAt(n.getCreatedAt());
            nd.setVersionNo(n.getVersionNo() == null ? 1 : n.getVersionNo());
            noteDtos.add(nd);
        }
        dto.setUnreadForAdmin(unreadForAdmin);
        dto.setUnreadForDesigner(unreadForDesigner);
        dto.setNoteCount(noteDtos.size());
        dto.setLatestNote(noteDtos.isEmpty() ? null : noteDtos.get(noteDtos.size() - 1));
        dto.setNotes(noteDtos);

        List<DesignPhaseFile> design = files.stream().filter(f -> isDesignFile(f) && versionOf(f) == version).toList();
        dto.setFileCount(design.size());
        dto.setPlanDocumentCount((int) files.stream().filter(f -> !isDesignFile(f)).count());
        // The file a quotation is made from: the newest of the kind that is easiest to open —
        // a PDF before an image, an image before a CAD drawing.
        design.stream()
                .min(Comparator.comparing((DesignPhaseFile f) -> DesignFileTypes.kind(f.getOriginalFileName()))
                        .thenComparing(DesignPhaseFile::getId, Comparator.reverseOrder()))
                .ifPresent(f -> dto.setCurrentDesignFile(fileDto(f)));
        return dto;
    }

    /** Written after the reader last looked (or they never did). */
    private static boolean after(LocalDateTime written, LocalDateTime seen) {
        return seen == null || (written != null && written.isAfter(seen));
    }
}
