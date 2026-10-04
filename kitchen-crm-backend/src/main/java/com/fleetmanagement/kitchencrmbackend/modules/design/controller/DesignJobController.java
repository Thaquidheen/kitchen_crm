package com.fleetmanagement.kitchencrmbackend.modules.design.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.design.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.design.service.DesignJobService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import com.fleetmanagement.kitchencrmbackend.security.ViewerScope;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Design jobs (customer designs assigned to Designer-type staff). Literal paths are declared before
 * /{id} so they always win. Designers only ever reach their own jobs; admin-only actions are guarded.
 */
@RestController
@RequestMapping("/api/v1/design-jobs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DesignJobController {

    @Autowired
    private DesignJobService service;

    private static Long id(UserPrincipal p) {
        return p != null ? p.getId() : null;
    }

    private static String name(UserPrincipal p) {
        return p != null ? p.getName() : null;
    }

    /** Admins, and Admin staff who coordinate designs: they assign designers and hand over plan documents. */
    private boolean coordinates(UserPrincipal user) {
        return ViewerScope.isSuperAdmin(user) || service.isCoordinator(id(user));
    }

    private static <T> ResponseEntity<ApiResponse<T>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Only admins and admin staff can do this"));
    }

    private static <T> ResponseEntity<ApiResponse<T>> respond(ApiResponse<T> r) {
        if (Boolean.TRUE.equals(r.getSuccess())) {
            return ResponseEntity.ok(r);
        }
        if ("Design job not found".equals(r.getMessage()) || "Designer not found".equals(r.getMessage())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(r);
        }
        return ResponseEntity.badRequest().body(r);
    }

    // ---- who am I (drives the designer menu / bell on the client)

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<DesignMeDto>> me(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(service.me(id(user), ViewerScope.isSuperAdmin(user))));
    }

    // ---- designers panel (names + workload are needed by anyone moving a customer to Design)

    @GetMapping("/designers")
    public ResponseEntity<ApiResponse<List<DesignerSummaryDto>>> designers() {
        return respond(service.designers());
    }

    @PutMapping("/designers/{userId}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DesignerSummaryDto>> setDesignerStatus(@PathVariable Long userId,
                                                                             @RequestBody DesignerStatusRequest body) {
        return respond(service.setDesignerStatus(userId, body.getStatus()));
    }

    // ---- bells

    @GetMapping("/my-feed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> myFeed(@AuthenticationPrincipal UserPrincipal user) {
        return respond(service.myFeed(id(user)));
    }

    @PutMapping("/my/seen-all")
    public ResponseEntity<ApiResponse<Integer>> markAllMineSeen(@AuthenticationPrincipal UserPrincipal user) {
        return respond(service.markAllMineSeen(id(user)));
    }

    @GetMapping("/attention")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> attention() {
        return respond(service.attention());
    }

    // ---- lists

    @GetMapping
    public ResponseEntity<ApiResponse<List<DesignJobDto>>> list(@AuthenticationPrincipal UserPrincipal user,
                                                                @RequestParam(required = false) Long designerId,
                                                                @RequestParam(defaultValue = "false") boolean includeClosed) {
        boolean admin = ViewerScope.isSuperAdmin(user);
        return respond(service.list(id(user), admin, !admin && service.isCoordinator(id(user)), designerId, includeClosed));
    }

    @GetMapping("/unassigned")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> unassigned(@AuthenticationPrincipal UserPrincipal user) {
        if (!coordinates(user)) {
            return forbidden();
        }
        return respond(service.unassignedCustomers());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<DesignJobDto>> forCustomer(@PathVariable Long customerId) {
        return respond(service.getForCustomer(customerId));
    }

    /** Customers at Quotation Stage or later with their design (or none). */
    @GetMapping("/library")
    public ResponseEntity<ApiResponse<List<DesignLibraryRowDto>>> library(@AuthenticationPrincipal UserPrincipal user) {
        if (!coordinates(user)) {
            return forbidden();
        }
        return respond(service.library());
    }

    /**
     * An already existing design PDF for a customer. Any staff member may upload it (that is how a
     * customer whose design was made elsewhere reaches Quotation Stage); only an admin may use it
     * to settle a design a designer is still working on.
     */
    @PostMapping(value = "/customer/{customerId}/design", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DesignJobDto>> uploadCustomerDesign(
            @PathVariable Long customerId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "note", required = false) String note,
            @RequestParam(value = "moveToQuotation", defaultValue = "false") boolean moveToQuotation,
            @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.uploadCustomerDesign(customerId, file, note, moveToQuotation, id(user), name(user),
                ViewerScope.isSuperAdmin(user)));
    }

    // ---- admin management

    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<DesignJobDto>> assign(@Valid @RequestBody DesignAssignRequest body,
                                                            @AuthenticationPrincipal UserPrincipal user) {
        if (!coordinates(user)) {
            return forbidden();
        }
        return respond(service.assign(body, id(user)));
    }

    @PutMapping("/reorder")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<DesignJobDto>>> reorder(@Valid @RequestBody DesignReorderRequest body) {
        return respond(service.reorder(body));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DesignJobDto>> update(@PathVariable Long id,
                                                            @RequestBody DesignJobUpdateRequest body,
                                                            @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.update(id, body, id(user)));
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DesignJobDto>> review(@PathVariable Long id,
                                                            @Valid @RequestBody DesignReviewRequest body,
                                                            @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.review(id, body, id(user), name(user)));
    }

    @PostMapping("/{id}/redesign")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DesignJobDto>> redesign(@PathVariable Long id,
                                                              @Valid @RequestBody DesignRedesignRequest body,
                                                              @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.requestRedesign(id, body, id(user), name(user)));
    }

    @PostMapping(value = "/{id}/plan-documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DesignJobDto>> uploadPlanDocuments(@PathVariable Long id,
                                                                         @RequestParam("files") MultipartFile[] files,
                                                                         @AuthenticationPrincipal UserPrincipal user) {
        if (!coordinates(user)) {
            return forbidden();
        }
        return respond(service.uploadPlanDocuments(id, files, name(user), ViewerScope.isSuperAdmin(user)));
    }

    // ---- job (admin or its designer)

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DesignJobDto>> get(@PathVariable Long id,
                                                         @AuthenticationPrincipal UserPrincipal user) {
        boolean admin = ViewerScope.isSuperAdmin(user);
        return respond(service.get(id, id(user), admin, !admin && service.isCoordinator(id(user))));
    }

    @PutMapping("/{id}/start")
    public ResponseEntity<ApiResponse<DesignJobDto>> start(@PathVariable Long id,
                                                           @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.start(id, id(user)));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<DesignJobDto>> complete(@PathVariable Long id,
                                                              @RequestBody(required = false) DesignCompleteRequest body,
                                                              @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.complete(id, body != null ? body.getMessage() : null, id(user), name(user)));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<DesignJobDto>> addNote(@PathVariable Long id,
                                                             @Valid @RequestBody DesignNoteRequest body,
                                                             @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.addNote(id, body.getMessage(), id(user), name(user), ViewerScope.isSuperAdmin(user)));
    }

    @PutMapping("/{id}/seen")
    public ResponseEntity<ApiResponse<DesignJobDto>> seen(@PathVariable Long id,
                                                          @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.markSeen(id, id(user), ViewerScope.isSuperAdmin(user)));
    }

    @PostMapping(value = "/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DesignJobDto>> upload(@PathVariable Long id,
                                                            @RequestParam("file") MultipartFile file,
                                                            @RequestParam(value = "description", required = false) String description,
                                                            @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.uploadFile(id, file, description, id(user), name(user), ViewerScope.isSuperAdmin(user)));
    }

    @DeleteMapping("/{id}/files/{fileId}")
    public ResponseEntity<ApiResponse<DesignJobDto>> deleteFile(@PathVariable Long id,
                                                                @PathVariable Long fileId,
                                                                @AuthenticationPrincipal UserPrincipal user) {
        boolean admin = ViewerScope.isSuperAdmin(user);
        return respond(service.deleteFile(id, fileId, id(user), admin, !admin && service.isCoordinator(id(user))));
    }
}
