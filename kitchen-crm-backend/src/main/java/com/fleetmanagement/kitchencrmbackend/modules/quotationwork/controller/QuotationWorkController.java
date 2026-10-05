package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.service.QuotationWorkService;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.service.QuotationWorkService.Viewer;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import com.fleetmanagement.kitchencrmbackend.security.ViewerScope;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Quotation work board. Admins and Admin staff manage it (assign, priority, order); everybody
 * else only reaches the work assigned to them. Literal paths are declared before /{id}.
 */
@RestController
@RequestMapping("/api/v1/quotation-jobs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class QuotationWorkController {

    @Autowired
    private QuotationWorkService service;

    private Viewer viewer(UserPrincipal user) {
        Long id = user != null ? user.getId() : null;
        boolean superAdmin = ViewerScope.isSuperAdmin(user);
        return new Viewer(id, user != null ? user.getName() : null, superAdmin, !superAdmin && service.isCoordinator(id));
    }

    private static <T> ResponseEntity<ApiResponse<T>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Only admins and admin staff can do this"));
    }

    private static <T> ResponseEntity<ApiResponse<T>> respond(ApiResponse<T> r) {
        if (Boolean.TRUE.equals(r.getSuccess())) {
            return ResponseEntity.ok(r);
        }
        if ("Quotation work not found".equals(r.getMessage()) || "Customer not found".equals(r.getMessage())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(r);
        }
        return ResponseEntity.badRequest().body(r);
    }

    // ---- who am I (drives the board and the bell on the client)

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<QuotationWorkMeDto>> me(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(service.me(viewer(user))));
    }

    // ---- bell

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> feed(@AuthenticationPrincipal UserPrincipal user) {
        return respond(service.feed(viewer(user)));
    }

    @PutMapping("/seen")
    public ResponseEntity<ApiResponse<Integer>> markSeen(@AuthenticationPrincipal UserPrincipal user) {
        return respond(service.markSeen(viewer(user)));
    }

    // ---- lists

    @GetMapping
    public ResponseEntity<ApiResponse<List<QuotationJobDto>>> list(@AuthenticationPrincipal UserPrincipal user) {
        return respond(service.list(viewer(user)));
    }

    @GetMapping("/unassigned")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> unassigned(@AuthenticationPrincipal UserPrincipal user) {
        if (!viewer(user).manages()) {
            return forbidden();
        }
        return respond(service.unassigned());
    }

    @GetMapping("/assignees")
    public ResponseEntity<ApiResponse<List<QuotationAssigneeDto>>> assignees(@AuthenticationPrincipal UserPrincipal user) {
        if (!viewer(user).manages()) {
            return forbidden();
        }
        return respond(service.assignees());
    }

    // ---- managing the board

    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<QuotationJobDto>> assign(@Valid @RequestBody QuotationJobAssignRequest body,
                                                               @AuthenticationPrincipal UserPrincipal user) {
        Viewer viewer = viewer(user);
        if (!viewer.manages()) {
            return forbidden();
        }
        return respond(service.assign(body, viewer));
    }

    @PutMapping("/reorder")
    public ResponseEntity<ApiResponse<List<QuotationJobDto>>> reorder(@Valid @RequestBody QuotationJobReorderRequest body,
                                                                      @AuthenticationPrincipal UserPrincipal user) {
        Viewer viewer = viewer(user);
        if (!viewer.manages()) {
            return forbidden();
        }
        return respond(service.reorder(body, viewer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuotationJobDto>> update(@PathVariable Long id,
                                                               @RequestBody QuotationJobUpdateRequest body,
                                                               @AuthenticationPrincipal UserPrincipal user) {
        Viewer viewer = viewer(user);
        if (!viewer.manages()) {
            return forbidden();
        }
        return respond(service.update(id, body, viewer));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<QuotationJobDto>> cancel(@PathVariable Long id,
                                                               @AuthenticationPrincipal UserPrincipal user) {
        Viewer viewer = viewer(user);
        if (!viewer.manages()) {
            return forbidden();
        }
        return respond(service.cancel(id, viewer));
    }

    // ---- doing the work (the assignee, or whoever manages)

    @PutMapping("/{id}/start")
    public ResponseEntity<ApiResponse<QuotationJobDto>> start(@PathVariable Long id,
                                                              @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.start(id, viewer(user)));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<QuotationJobDto>> complete(@PathVariable Long id,
                                                                 @RequestBody(required = false) QuotationJobCompleteRequest body,
                                                                 @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.complete(id, body, viewer(user)));
    }
}
