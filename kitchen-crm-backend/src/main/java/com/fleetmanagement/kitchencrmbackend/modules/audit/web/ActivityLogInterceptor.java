package com.fleetmanagement.kitchencrmbackend.modules.audit.web;

import com.fleetmanagement.kitchencrmbackend.modules.audit.entity.ActivityLog;
import com.fleetmanagement.kitchencrmbackend.modules.audit.service.ActivityLogService;
import com.fleetmanagement.kitchencrmbackend.common.util.ClientIpResolver;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.Set;

/**
 * Audits every authenticated WRITE request (POST/PUT/PATCH/DELETE) as an ACTION row: who, which
 * module, what path, response status, from which IP. Reads are deliberately not logged — they
 * are noise at this team's scale, and logins are recorded separately in AuthServiceImpl.
 *
 * Runs in afterCompletion so the response status is known, and delegates to
 * ActivityLogService.record, which swallows every failure — auditing must never break a request.
 */
@Component
public class ActivityLogInterceptor implements HandlerInterceptor {

    /**
     * signin is covered by the dedicated LOGIN/LOGIN_FAILED rows written in AuthServiceImpl, and
     * refresh fires on a timer for every active session — logging it would bury everything else.
     */
    private static final Set<String> SKIP_PATHS = Set.of(
            "/api/v1/auth/signin",
            "/api/v1/auth/refresh");

    private static final Map<String, String> AUTH_SUMMARIES = Map.of(
            "/api/v1/auth/signup", "Created a user account",
            "/api/v1/auth/change-password", "Changed own password",
            "/api/v1/auth/reset-password", "Reset a password via token",
            "/api/v1/auth/forgot-password", "Requested a password reset",
            "/api/v1/auth/logout", "Signed out",
            "/api/v1/auth/logout-all", "Signed out of all devices");

    @Autowired
    private ActivityLogService activityLogService;

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        try {
            String method = request.getMethod();
            if (!("POST".equals(method) || "PUT".equals(method)
                    || "PATCH".equals(method) || "DELETE".equals(method))) {
                return;
            }
            String uri = request.getRequestURI();
            // Skip ONLY the high-volume paths that are already covered elsewhere. A blanket
            // /api/v1/auth/ skip silently excluded the most security-relevant writes in the app:
            // signup mints accounts (and honours a client-supplied "admin" role, i.e. it can
            // create another SUPER_ADMIN), change-password/reset-password take over an account,
            // and logout-all revokes sessions. Those must appear in the trail.
            if (SKIP_PATHS.contains(uri)) {
                return;
            }

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
                return; // anonymous (e.g. public signature) — nothing to attribute
            }

            activityLogService.record(
                    eventTypeFor(uri),
                    principal.getUsername(), // email — getUsername() returns it
                    principal.getName(),
                    roleOf(auth),
                    moduleOf(handler, uri),
                    method,
                    summaryFor(method, uri),
                    response.getStatus(),
                    ClientIpResolver.resolve(request),
                    request.getHeader("User-Agent"));
        } catch (Exception ignored) {
            // Never let auditing interfere with the request lifecycle.
        }
    }

    /**
     * /logout and /logout-all are recorded as LOGOUT so the viewer can pair a sign-in with its
     * sign-out; everything else is a plain ACTION.
     */
    private ActivityLog.EventType eventTypeFor(String uri) {
        return uri.startsWith("/api/v1/auth/logout")
                ? ActivityLog.EventType.LOGOUT
                : ActivityLog.EventType.ACTION;
    }

    /**
     * Method + path reads well for CRUD, but the auth writes deserve plain English because they
     * are what an admin scans for. Never include the query string or body: reset tokens, OTPs and
     * passwords travel there.
     */
    private String summaryFor(String method, String uri) {
        String label = AUTH_SUMMARIES.get(uri);
        return label != null ? label : method + " " + uri;
    }

    /**
     * Module from the handler's package — modules/<name>/... — which survives every path-shape
     * inconsistency (/production/issues vs /production-custom-tasks, versionless
     * /api/notifications, nested customer sub-resources). URI prefix is only the fallback.
     */
    private String moduleOf(Object handler, String uri) {
        if (handler instanceof HandlerMethod hm) {
            String pkg = hm.getBeanType().getPackageName();
            int i = pkg.indexOf(".modules.");
            if (i >= 0) {
                String rest = pkg.substring(i + ".modules.".length());
                int dot = rest.indexOf('.');
                return dot > 0 ? rest.substring(0, dot) : rest;
            }
        }
        String path = uri.startsWith("/api/v1/") ? uri.substring(8) : uri.startsWith("/api/") ? uri.substring(5) : uri;
        int slash = path.indexOf('/');
        return slash > 0 ? path.substring(0, slash) : path;
    }

    private String roleOf(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .findFirst()
                .orElse(null);
    }
}
