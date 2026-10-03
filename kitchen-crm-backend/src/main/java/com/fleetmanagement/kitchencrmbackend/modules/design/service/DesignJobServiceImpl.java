package com.fleetmanagement.kitchencrmbackend.modules.design.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignFileUploadRequest;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.DesignPhaseFileDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase.DesignStatus;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhaseFile;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.DesignPhaseFileService;
import com.fleetmanagement.kitchencrmbackend.modules.design.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.design.entity.DesignPhaseNote;
import com.fleetmanagement.kitchencrmbackend.modules.design.repository.DesignJobRepository;
import com.fleetmanagement.kitchencrmbackend.modules.design.repository.DesignPhaseNoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private static final Set<String> PRIORITIES = Set.of("LOW", "MEDIUM", "HIGH", "URGENT");
    private static final Set<String> DESIGNER_STATUSES = Set.of("AVAILABLE", "BUSY", "ON_LEAVE");

    /** The designer has work to do on these. */
    private static final Set<DesignStatus> DESIGNER_WORK = EnumSet.of(
            DesignStatus.PLANNING, DesignStatus.IN_PROGRESS, DesignStatus.REVISION_REQUIRED);
    /** Finished or stopped: not in any queue or bell. */
    private static final Set<DesignStatus> CLOSED = EnumSet.of(
            DesignStatus.APPROVED_BY_ADMIN, DesignStatus.SUBMITTED, DesignStatus.FEEDBACK_RECEIVED,
            DesignStatus.APPROVED, DesignStatus.FROZEN, DesignStatus.CANCELLED);

    @Autowired
    private DesignJobRepository jobRepository;
    @Autowired
    private DesignPhaseNoteRepository noteRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CustomerRepository customerRepository;
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
    public DesignMeDto me(Long userId) {
        DesignMeDto dto = new DesignMeDto();
        dto.setUserId(userId);
        User user = userId == null ? null : userRepository.findById(userId).orElse(null);
        if (user != null) {
            dto.setStaffType(user.getStaffType());
            dto.setDesignerStatus(user.getDesignerStatus());
        }
        dto.setDesigner(user != null && STAFF_TYPE_DESIGNER.equals(user.getStaffType()));
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<DesignJobDto>> list(Long callerId, boolean admin, Long designerId, boolean includeClosed) {
        List<DesignPhase> jobs;
        if (!admin) {
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
        return ApiResponse.success(toDtos(visible));
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<DesignJobDto> get(Long jobId, Long callerId, boolean admin) {
        DesignPhase job = jobRepository.findById(jobId).orElse(null);
        if (job == null || !canAccess(job, callerId, admin)) {
            return ApiResponse.error("Design job not found");
        }
        return ApiResponse.success(detail(job));
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<DesignJobDto> getForCustomer(Long customerId) {
        List<DesignPhase> jobs = jobRepository.findByCustomerNewestFirst(customerId);
        if (jobs.isEmpty()) {
            return ApiResponse.success("No design job", null);
        }
        DesignJobDto dto = toDtos(List.of(jobs.get(0))).get(0);
        // The customer page shows who/what/when only — the conversation stays with admin + designer.
        dto.setLatestNote(null);
        return ApiResponse.success(dto);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> unassignedCustomers() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Customer c : jobRepository.findUnassignedDesignCustomers(Customer.CustomerStatus.DESIGN_STAGE,
                DesignStatus.CANCELLED)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("customerId", c.getId());
            row.put("customerName", c.getName());
            row.put("customerPlace", c.getPlace());
            rows.add(row);
        }
        return ApiResponse.success(rows);
    }

    // ------------------------------------------------------------------ assignment

    @Override
    public String ensureAssignedForDesignStage(Customer customer, Long designerId, LocalDate dueDate, String priority,
                                               String brief, Long byUserId) {
        DesignPhase existing = latestJob(customer.getId());
        if (designerId == null) {
            // Already has a live job with a designer (e.g. moved out of Design and back): keep it.
            if (existing != null && existing.getStaffAssigned() != null && status(existing) != DesignStatus.CANCELLED) {
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
        DesignPhase job = existing != null ? existing : newJob(customer);
        boolean reopening = existing != null && CLOSED.contains(status(existing));
        boolean newDesigner = job.getStaffAssigned() == null || !job.getStaffAssigned().getId().equals(designer.getId());
        if (existing == null || reopening || newDesigner) {
            assignTo(job, designer, byUserId);
        }
        if (reopening) {
            // Back into design after it was finished: that is another revision of the same design.
            job.setRevisionCount(nz(job.getRevisionCount()) + 1);
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
        return null;
    }

    @Override
    public ApiResponse<DesignJobDto> assign(DesignAssignRequest request, Long adminId) {
        Customer customer = customerRepository.findById(request.getCustomerId()).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }
        String error = ensureAssignedForDesignStage(customer, request.getDesignerId(), request.getDueDate(),
                request.getPriority(), request.getBrief(), adminId);
        if (error != null) {
            return ApiResponse.error(error);
        }
        DesignPhase job = latestJob(customer.getId());
        // assign() is an explicit admin action: a new designer always gets the job, even if one was set.
        if (job != null && (job.getStaffAssigned() == null || !job.getStaffAssigned().getId().equals(request.getDesignerId()))) {
            User designer = userRepository.findById(request.getDesignerId()).orElse(null);
            assignTo(job, designer, adminId);
            jobRepository.save(job);
        }
        return ApiResponse.success("Designer assigned", detail(job));
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
        }
        if (newDesigner != null) {
            assignTo(job, newDesigner, adminId);
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
        if (newStatus != null && newStatus != status(job)) {
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
        long files = fileCount(job.getId());
        if (files == 0) {
            return ApiResponse.error("Upload the design file before marking it complete");
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
        LocalDateTime now = LocalDateTime.now();
        switch (decision) {
            case "APPROVE" -> job.setDesignStatus(DesignStatus.APPROVED_BY_ADMIN);
            case "CHANGES" -> {
                if (!hasNote) {
                    return ApiResponse.error("Say what needs to change");
                }
                job.setDesignStatus(DesignStatus.REVISION_REQUIRED);
                job.setRevisionCount(nz(job.getRevisionCount()) + 1);
            }
            default -> {
                return ApiResponse.error("Decision must be APPROVE or CHANGES");
            }
        }
        job.setCompletionSeenAt(now);
        job.setDesignerSeenAt(null); // news for the designer either way
        if (hasNote) {
            saveNote(job, request.getNote(), adminId, adminName, false);
            job.setAdminNotesSeenAt(now);
        }
        jobRepository.save(job);
        return ApiResponse.success("APPROVE".equals(decision) ? "Design approved" : "Changes requested", detail(job));
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

    @Override
    public ApiResponse<DesignJobDto> uploadFile(Long jobId, MultipartFile file, String description, Long callerId,
                                                String callerName, boolean admin) {
        DesignPhase job = jobRepository.findById(jobId).orElse(null);
        if (job == null || !canAccess(job, callerId, admin)) {
            return ApiResponse.error("Design job not found");
        }
        if (file == null || file.isEmpty()) {
            return ApiResponse.error("Choose a file to upload");
        }
        DesignFileUploadRequest request = new DesignFileUploadRequest();
        request.setDesignPhaseId(job.getId());
        request.setFileCategory(DesignPhaseFile.FileCategory.DESIGN);
        request.setDescription(description);
        ApiResponse<DesignPhaseFileDto> stored = fileService.uploadDesignFile(file, request, callerName);
        if (!Boolean.TRUE.equals(stored.getSuccess())) {
            return ApiResponse.error(stored.getMessage());
        }
        return ApiResponse.success("File uploaded", detail(job));
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

    private DesignPhase latestJob(Long customerId) {
        List<DesignPhase> jobs = jobRepository.findByCustomerNewestFirst(customerId);
        return jobs.isEmpty() ? null : jobs.get(0);
    }

    private DesignPhase newJob(Customer customer) {
        DesignPhase job = new DesignPhase();
        job.setCustomer(customer);
        job.setDesignStatus(DesignStatus.PLANNING);
        job.setRevisionCount(0);
        return job;
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
        noteRepository.save(note);
    }

    private long fileCount(Long jobId) {
        long n = 0;
        for (Object[] row : jobRepository.countFiles(List.of(jobId))) {
            n += ((Number) row[1]).longValue();
        }
        return n;
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

    private DesignJobDto detail(DesignPhase job) {
        DesignJobDto dto = toDtos(List.of(job)).get(0);
        ApiResponse<List<DesignPhaseFileDto>> files = fileService.getDesignPhaseFiles(job.getId());
        dto.setFiles(files != null && Boolean.TRUE.equals(files.getSuccess()) && files.getData() != null
                ? files.getData() : List.of());
        return dto;
    }

    /** Batch conversion: one query for notes, one for file counts. Notes are attached in full. */
    private List<DesignJobDto> toDtos(List<DesignPhase> jobs) {
        if (jobs.isEmpty()) {
            return new ArrayList<>();
        }
        List<Long> ids = jobs.stream().map(DesignPhase::getId).filter(Objects::nonNull).toList();
        Map<Long, List<DesignPhaseNote>> notesByJob = new HashMap<>();
        Map<Long, Long> filesByJob = new HashMap<>();
        if (!ids.isEmpty()) {
            for (DesignPhaseNote n : noteRepository.findForJobs(ids)) {
                notesByJob.computeIfAbsent(n.getDesignPhase().getId(), k -> new ArrayList<>()).add(n);
            }
            for (Object[] row : jobRepository.countFiles(ids)) {
                filesByJob.put((Long) row[0], ((Number) row[1]).longValue());
            }
        }
        LocalDate today = today();
        List<DesignJobDto> out = new ArrayList<>(jobs.size());
        for (DesignPhase d : jobs) {
            out.add(toDto(d, notesByJob.getOrDefault(d.getId(), List.of()), filesByJob.getOrDefault(d.getId(), 0L), today));
        }
        return out;
    }

    private DesignJobDto toDto(DesignPhase d, List<DesignPhaseNote> notes, long files, LocalDate today) {
        DesignStatus s = status(d);
        DesignJobDto dto = new DesignJobDto();
        dto.setId(d.getId());
        if (d.getCustomer() != null) {
            dto.setCustomerId(d.getCustomer().getId());
            dto.setCustomerName(d.getCustomer().getName());
            dto.setCustomerPlace(d.getCustomer().getPlace());
        }
        if (d.getStaffAssigned() != null) {
            dto.setDesignerId(d.getStaffAssigned().getId());
            dto.setDesignerName(d.getStaffAssigned().getName());
        }
        dto.setStatus(s.name());
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
            noteDtos.add(nd);
        }
        dto.setUnreadForAdmin(unreadForAdmin);
        dto.setUnreadForDesigner(unreadForDesigner);
        dto.setNoteCount(noteDtos.size());
        dto.setFileCount((int) files);
        dto.setLatestNote(noteDtos.isEmpty() ? null : noteDtos.get(noteDtos.size() - 1));
        dto.setNotes(noteDtos);
        return dto;
    }

    /** Written after the reader last looked (or they never did). */
    private static boolean after(LocalDateTime written, LocalDateTime seen) {
        return seen == null || (written != null && written.isAfter(seen));
    }
}
