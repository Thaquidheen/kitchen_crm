package com.fleetmanagement.kitchencrmbackend.modules.finance.web;

import com.fleetmanagement.kitchencrmbackend.modules.finance.service.FinanceAccessService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Second lock on the customer-finance API: without a valid unlock key the endpoints answer as if
 * they do not exist.
 *
 * 404 rather than 403 is the point. A 403 confirms there is something there to be authorised for,
 * which is exactly what a concealed module must not admit; 404 matches what the UI shows, where a
 * blocked finance route and a mistyped URL both land on the dashboard.
 *
 * This runs IN ADDITION to @PreAuthorize("hasRole('SUPER_ADMIN')") on every finance endpoint. A
 * staff token is refused by that check and never reaches this one, so the unlock is a second factor
 * for the super admin, not a substitute for the role.
 */
@Component
public class FinanceAccessInterceptor implements HandlerInterceptor {

    public static final String HEADER = "X-Reporting-Key";

    @Autowired
    private FinanceAccessService financeAccessService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        // Let CORS preflight through untouched; it carries no credentials to check.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long userId = (auth != null && auth.getPrincipal() instanceof UserPrincipal p) ? p.getId() : null;

        if (userId != null && financeAccessService.isUnlocked(request.getHeader(HEADER), userId)) {
            return true;
        }
        notFound(response);
        return false;
    }

    /** Shaped like an ordinary not-found so it is indistinguishable from a bad path. */
    private void notFound(HttpServletResponse response) throws Exception {
        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"success\":false,\"message\":\"Not found\",\"data\":null}");
    }
}
