package com.fleetmanagement.kitchencrmbackend.modules.customer.requirementsheet;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * A customer's requirement sheet on the customer page. Seeing it needs "See customer details",
 * changing it "Requirement sheet" (both in PermissionInterceptor). The designer's read-only copy is
 * GET /api/v1/design-jobs/{id}/requirement-sheet.
 */
@RestController
@RequestMapping("/api/v1/customers/{customerId}/requirement-sheet")
@CrossOrigin(origins = "*", maxAge = 3600)
public class RequirementSheetController {

    @Autowired
    private RequirementSheetService service;

    private static <T> ResponseEntity<ApiResponse<T>> respond(ApiResponse<T> r) {
        if (Boolean.TRUE.equals(r.getSuccess())) {
            return ResponseEntity.ok(r);
        }
        if (RequirementSheetService.CUSTOMER_NOT_FOUND.equals(r.getMessage())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(r);
        }
        return ResponseEntity.badRequest().body(r);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<RequirementSheetDto>> get(@PathVariable Long customerId) {
        return respond(service.get(customerId));
    }

    /** Only the items sent change; see RequirementSheetSaveRequest. */
    @PutMapping
    public ResponseEntity<ApiResponse<RequirementSheetDto>> save(@PathVariable Long customerId,
                                                                 @RequestBody(required = false) RequirementSheetSaveRequest body,
                                                                 @AuthenticationPrincipal UserPrincipal user) {
        return respond(service.save(customerId, body,
                user != null ? user.getId() : null, user != null ? user.getName() : null));
    }
}
