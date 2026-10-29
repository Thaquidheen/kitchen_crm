package com.fleetmanagement.kitchencrmbackend.modules.customer.stagerequest;

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
 * Asking the admin to move a Follow Up customer back to Design Stage or Quotation Stage. Anyone who
 * may change a customer's stage can ask; only the admin answers. Literal paths before /{id}.
 */
@RestController
@RequestMapping("/api/v1/customer-stage-requests")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CustomerStageRequestController {

    @Autowired
    private CustomerStageRequestService service;
    @Autowired
    private PermissionService permissionService;

    private static Long id(UserPrincipal user) {
        return user != null ? user.getId() : null;
    }

    private static <T> ResponseEntity<ApiResponse<T>> respond(ApiResponse<T> r) {
        if (Boolean.TRUE.equals(r.getSuccess())) {
            return ResponseEntity.ok(r);
        }
        if ("Customer not found".equals(r.getMessage()) || "Request not found".equals(r.getMessage())) {
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
        if (!permissionService.can(user, Permission.CUSTOMERS_CHANGE_STAGE)) {
            return refused(PermissionInterceptor.message(Permission.CUSTOMERS_CHANGE_STAGE));
        }
        Object cid = body == null ? null : body.get("customerId");
        Long customerId = cid instanceof Number ? Long.valueOf(((Number) cid).longValue()) : null;
        Object to = body == null ? null : body.get("toStage");
        Object reason = body == null ? null : body.get("reason");
        return respond(service.request(customerId, to == null ? null : to.toString(),
                reason == null ? null : reason.toString(), id(user), user != null ? user.getName() : null));
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

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancel(@PathVariable Long id,
                                                                   @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.cancel(id, id(user), ViewerScope.isSuperAdmin(user)));
    }
}
