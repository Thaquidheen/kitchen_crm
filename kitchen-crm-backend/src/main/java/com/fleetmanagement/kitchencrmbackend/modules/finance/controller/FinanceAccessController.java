package com.fleetmanagement.kitchencrmbackend.modules.finance.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.finance.service.FinanceAccessService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Unlocks the concealed reporting module. Named neutrally on purpose: this path is visible in the
 * browser's network tab, so it should not announce what it opens.
 *
 * Every response is deliberately uninformative on failure — the same rejection for a wrong phrase,
 * an unconfigured phrase and a throttled caller. Distinguishing them would tell a prober which of
 * those states they are in, which is most of the way to knowing the feature exists.
 */
@RestController
@RequestMapping("/api/v1/reporting-access")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FinanceAccessController {

    @Autowired
    private FinanceAccessService financeAccessService;

    @PostMapping("/unlock")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> unlock(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {
        return financeAccessService.unlock(principal != null ? principal.getId() : null, body.get("passphrase"))
                .map(token -> {
                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("key", token);
                    data.put("expiresInSeconds", financeAccessService.ttlSeconds());
                    return ResponseEntity.ok(ApiResponse.success(data));
                })
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.error("Not available")));
    }

    /**
     * First-time setup and rotation. While no phrase exists this is settable without one, so the
     * owner can establish it themselves and the phrase never has to be shared with anyone to be
     * configured. After that, rotating requires the current phrase.
     */
    @PostMapping("/passphrase")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> setPassphrase(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {
        boolean ok = financeAccessService.setPassphrase(
                principal != null ? principal.getId() : null, body.get("current"), body.get("next"));
        return ResponseEntity.ok(ok
                ? ApiResponse.success("Updated", null)
                : ApiResponse.error("Could not update (minimum 8 characters; current key required once set)"));
    }
}
