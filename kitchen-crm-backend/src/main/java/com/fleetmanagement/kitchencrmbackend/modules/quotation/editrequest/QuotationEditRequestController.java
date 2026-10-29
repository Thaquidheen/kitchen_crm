package com.fleetmanagement.kitchencrmbackend.modules.quotation.editrequest;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.permission.Permission;
import com.fleetmanagement.kitchencrmbackend.modules.permission.service.PermissionService;
import com.fleetmanagement.kitchencrmbackend.modules.permission.web.PermissionInterceptor;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import com.fleetmanagement.kitchencrmbackend.security.ViewerScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Asking the admin to reopen a completed quotation. Anyone who may edit quotations can ask; only
 * the admin answers. Literal paths are declared before /{id}.
 */
@RestController
@RequestMapping("/api/v1/quotation-edit-requests")
@CrossOrigin(origins = "*", maxAge = 3600)
public class QuotationEditRequestController {

    @Autowired
    private QuotationEditRequestService service;
    @Autowired
    private PermissionService permissionService;

    private static Long id(UserPrincipal user) {
        return user != null ? user.getId() : null;
    }

    private static <T> ResponseEntity<ApiResponse<T>> respond(ApiResponse<T> r) {
        if (Boolean.TRUE.equals(r.getSuccess())) {
            return ResponseEntity.ok(r);
        }
        if ("Quotation not found".equals(r.getMessage()) || "Request not found".equals(r.getMessage())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(r);
        }
        return ResponseEntity.badRequest().body(r);
    }

    private static <T> ResponseEntity<ApiResponse<T>> refused(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(message));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list(@AuthenticationPrincipal UserPrincipal user) {
        return respond(service.list(id(user), ViewerScope.isSuperAdmin(user)));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> pending(@AuthenticationPrincipal UserPrincipal user) {
        if (!permissionService.can(user, Permission.QUOTATIONS_VIEW)) {
            return refused(PermissionInterceptor.message(Permission.QUOTATIONS_VIEW));
        }
        return respond(service.pending(id(user)));
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> feed(@AuthenticationPrincipal UserPrincipal user) {
        return respond(service.feed(id(user), ViewerScope.isSuperAdmin(user)));
    }

    @PutMapping("/seen")
    public ResponseEntity<ApiResponse<Integer>> seen(@AuthenticationPrincipal UserPrincipal user) {
        return respond(service.markSeen(id(user)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> request(@RequestBody Map<String, Object> body,
                                                                    @AuthenticationPrincipal UserPrincipal user) {
        if (!permissionService.can(user, Permission.QUOTATIONS_EDIT)) {
            return refused(PermissionInterceptor.message(Permission.QUOTATIONS_EDIT));
        }
        Object qid = body == null ? null : body.get("quotationId");
        Long quotationId = qid instanceof Number ? Long.valueOf(((Number) qid).longValue()) : null;
        Object reason = body == null ? null : body.get("reason");
        return respond(service.request(quotationId, reason == null ? null : reason.toString(), id(user),
                user != null ? user.getName() : null));
    }

    /** A quotation reopened through a request, edited, is marked Completed again. */
    @PostMapping("/finish")
    public ResponseEntity<ApiResponse<Map<String, Object>>> finish(@RequestBody Map<String, Object> body,
                                                                   @AuthenticationPrincipal UserPrincipal user) {
        if (!permissionService.can(user, Permission.QUOTATIONS_EDIT)) {
            return refused(PermissionInterceptor.message(Permission.QUOTATIONS_EDIT));
        }
        Object qid = body == null ? null : body.get("quotationId");
        Long quotationId = qid instanceof Number ? Long.valueOf(((Number) qid).longValue()) : null;
        return respond(service.finish(quotationId, id(user), user.getName()));
    }

    @PutMapping("/{id}/decide")
    public ResponseEntity<ApiResponse<Map<String, Object>>> decide(@PathVariable Long id,
                                                                   @RequestBody Map<String, Object> body,
                                                                   @AuthenticationPrincipal UserPrincipal user) {
        if (!ViewerScope.isSuperAdmin(user)) {
            return refused("Only the admin can answer this");
        }
        boolean approve = body != null && Boolean.TRUE.equals(body.get("approve"));
        Object note = body == null ? null : body.get("note");
        return respond(service.decide(id, approve, note == null ? null : note.toString(), id(user), user.getName()));
    }
}
