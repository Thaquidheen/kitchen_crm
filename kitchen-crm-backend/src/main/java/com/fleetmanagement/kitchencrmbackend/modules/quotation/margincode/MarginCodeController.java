package com.fleetmanagement.kitchencrmbackend.modules.quotation.margincode;

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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Margin codes. The list with its percentages and every change are the administrator's; staff
 * allowed to see margins get the codes alone (/options).
 */
@RestController
@RequestMapping("/api/v1/margin-codes")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MarginCodeController {

    @Autowired
    private MarginCodeService service;
    @Autowired
    private PermissionService permissionService;

    private static <T> ResponseEntity<ApiResponse<T>> refused(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(message));
    }

    private static <T> ResponseEntity<ApiResponse<T>> respond(ApiResponse<T> r) {
        if (Boolean.TRUE.equals(r.getSuccess())) {
            return ResponseEntity.ok(r);
        }
        return "Margin code not found".equals(r.getMessage())
                ? ResponseEntity.status(HttpStatus.NOT_FOUND).body(r)
                : ResponseEntity.badRequest().body(r);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list(@AuthenticationPrincipal UserPrincipal user) {
        if (!ViewerScope.isSuperAdmin(user)) {
            return refused("Only the admin sees the margin percentages");
        }
        return ResponseEntity.ok(ApiResponse.success(service.list()));
    }

    /** The codes that can be chosen, and the code of each category's default margin. No percentages. */
    @GetMapping("/options")
    public ResponseEntity<ApiResponse<Map<String, Object>>> options(@AuthenticationPrincipal UserPrincipal user) {
        if (!permissionService.can(user, Permission.QUOTATIONS_SEE_MARGINS)) {
            return refused(PermissionInterceptor.message(Permission.QUOTATIONS_SEE_MARGINS));
        }
        return ResponseEntity.ok(ApiResponse.success(service.options()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(@RequestBody Map<String, Object> body,
                                                                   @AuthenticationPrincipal UserPrincipal user) {
        if (!ViewerScope.isSuperAdmin(user)) {
            return refused("Only the admin sets margin codes");
        }
        return respond(service.save(null, text(body, "code"), number(body, "percentage"), bool(body, "active"), text(body, "note")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> update(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                                                   @AuthenticationPrincipal UserPrincipal user) {
        if (!ViewerScope.isSuperAdmin(user)) {
            return refused("Only the admin sets margin codes");
        }
        return respond(service.save(id, text(body, "code"), number(body, "percentage"), bool(body, "active"), text(body, "note")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
        if (!ViewerScope.isSuperAdmin(user)) {
            return refused("Only the admin sets margin codes");
        }
        return respond(service.delete(id));
    }

    private static String text(Map<String, Object> body, String key) {
        Object v = body == null ? null : body.get(key);
        return v == null ? null : v.toString();
    }

    private static Boolean bool(Map<String, Object> body, String key) {
        Object v = body == null ? null : body.get(key);
        return v instanceof Boolean b ? b : null;
    }

    private static BigDecimal number(Map<String, Object> body, String key) {
        Object v = body == null ? null : body.get(key);
        if (v instanceof Number n) {
            return new BigDecimal(n.toString());
        }
        try {
            return v == null ? null : new BigDecimal(v.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
