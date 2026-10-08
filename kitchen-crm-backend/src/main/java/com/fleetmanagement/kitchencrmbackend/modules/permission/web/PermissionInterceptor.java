package com.fleetmanagement.kitchencrmbackend.modules.permission.web;

import com.fleetmanagement.kitchencrmbackend.modules.permission.Permission;
import com.fleetmanagement.kitchencrmbackend.modules.permission.service.PermissionService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

/**
 * The one place that says which permission an API call needs. Every guarded address is listed in
 * {@link #RULES}; the first rule that matches decides. A call no rule mentions is not restricted
 * here (it may still carry its own role check).
 *
 * <p>Two things cannot be decided from the address alone and are checked where they happen:
 * what a person without {@code customers.view} gets back (CustomerController trims the answer),
 * and reminders or design uploads whose meaning depends on what is sent (their controllers ask).
 */
@Component
public class PermissionInterceptor implements HandlerInterceptor {

    private static final Set<String> ANY = Set.of("GET", "POST", "PUT", "PATCH", "DELETE");
    private static final Set<String> READ = Set.of("GET");
    private static final Set<String> WRITE = Set.of("POST", "PUT", "PATCH", "DELETE");

    /** methods, address pattern, permission needed. */
    record Rule(Set<String> methods, String pattern, Permission permission) {
    }

    static final List<Rule> RULES = List.of(
            // ---- customers: the record itself
            new Rule(Set.of("PATCH"), "/api/v1/customers/*/status", Permission.CUSTOMERS_CHANGE_STAGE),
            new Rule(Set.of("POST"), "/api/v1/customers", Permission.CUSTOMERS_ADD),
            // plan images sit under /customers/plan-images/… and are part of a customer's details
            new Rule(WRITE, "/api/v1/customers/plan-images/**", Permission.CUSTOMERS_EDIT),
            new Rule(WRITE, "/api/v1/customers/*/requirements", Permission.CUSTOMERS_EDIT),
            new Rule(WRITE, "/api/v1/customers/*/pipeline", Permission.CUSTOMERS_EDIT),
            new Rule(READ, "/api/v1/customers/*/requirements", Permission.CUSTOMERS_VIEW),
            new Rule(READ, "/api/v1/customers/*/pipeline", Permission.CUSTOMERS_VIEW),
            new Rule(Set.of("PUT"), "/api/v1/customers/*", Permission.CUSTOMERS_EDIT),
            new Rule(Set.of("DELETE"), "/api/v1/customers/*", Permission.CUSTOMERS_DELETE),
            // ---- activity and notes
            new Rule(Set.of("POST"), "/api/v1/workflow/customer/*/notes", Permission.CUSTOMERS_NOTES),
            new Rule(READ, "/api/v1/workflow/customer/*", Permission.CUSTOMERS_VIEW),
            // ---- follow-ups
            new Rule(ANY, "/api/v1/followups", Permission.CUSTOMERS_FOLLOWUPS),
            new Rule(ANY, "/api/v1/followups/**", Permission.CUSTOMERS_FOLLOWUPS),
            // ---- reminders on a customer (creating one is checked in the controller)
            new Rule(READ, "/api/v1/reminders/customer/*", Permission.CUSTOMERS_REMINDERS),
            // ---- existing design PDF
            new Rule(Set.of("POST"), "/api/v1/design-jobs/customer/*/design", Permission.CUSTOMERS_UPLOAD_DESIGN),
            // ---- site measurement
            new Rule(ANY, "/api/v1/site-measurements/**", Permission.CUSTOMERS_SITE_MEASUREMENT),
            // ---- a customer's quotations on the customer page
            new Rule(READ, "/api/v1/quotations/customer/*", Permission.CUSTOMERS_QUOTATIONS),

            // Quotations. The stamped "approved" PDF stays with the administrator (its own rule on
            // the controller); pricing — who sees rates and margins — is decided inside the answer.
            new Rule(Set.of("DELETE"), "/api/v1/quotations/folders/*", Permission.QUOTATIONS_DELETE),
            new Rule(Set.of("DELETE"), "/api/v1/quotations/*", Permission.QUOTATIONS_DELETE),
            new Rule(Set.of("PATCH"), "/api/v1/quotations/*/status", Permission.QUOTATIONS_CHANGE_STATUS),
            new Rule(READ, "/api/v1/quotations/*/pdf", Permission.QUOTATIONS_PDF),
            new Rule(Set.of("POST"), "/api/v1/quotations", Permission.QUOTATIONS_CREATE),
            new Rule(Set.of("POST"), "/api/v1/quotations/*/duplicate", Permission.QUOTATIONS_CREATE),
            new Rule(Set.of("PUT"), "/api/v1/quotations/folders/*", Permission.QUOTATIONS_EDIT),
            new Rule(Set.of("PUT"), "/api/v1/quotations/*", Permission.QUOTATIONS_EDIT),
            new Rule(READ, "/api/v1/quotations", Permission.QUOTATIONS_VIEW),
            new Rule(READ, "/api/v1/quotations/**", Permission.QUOTATIONS_VIEW),
            // ---- a customer's production (the overview lists of the Production page stay open)
            new Rule(ANY, "/api/v1/production-installation/customer/**", Permission.CUSTOMERS_PRODUCTION),
            new Rule(Set.of("POST"), "/api/v1/production-installation", Permission.CUSTOMERS_PRODUCTION),
            new Rule(ANY, "/api/v1/production/task-groups", Permission.CUSTOMERS_PRODUCTION),
            new Rule(ANY, "/api/v1/production/task-groups/**", Permission.CUSTOMERS_PRODUCTION),
            new Rule(ANY, "/api/v1/production-custom-tasks", Permission.CUSTOMERS_PRODUCTION),
            new Rule(ANY, "/api/v1/production-custom-tasks/**", Permission.CUSTOMERS_PRODUCTION),
            new Rule(ANY, "/api/v1/production/issues", Permission.CUSTOMERS_PRODUCTION),
            new Rule(ANY, "/api/v1/production/issues/**", Permission.CUSTOMERS_PRODUCTION)
    );

    private static final AntPathMatcher MATCHER = new AntPathMatcher();

    @Autowired
    private PermissionService permissionService;

    /** The permission this call needs, or null when no rule covers it. */
    static Permission needed(String method, String path) {
        String m = method == null ? "" : method.toUpperCase();
        for (Rule rule : RULES) {
            if (rule.methods().contains(m) && MATCHER.match(rule.pattern(), path)) {
                return rule.permission();
            }
        }
        return null;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        // Spring finds the controller by the DECODED path segments, but this attribute holds the
        // path as it was sent. Decoded first, or ".../%64esign" would reach the controller of
        // ".../design" and match no rule here.
        Object matched = request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String path = decoded(matched != null ? matched.toString() : request.getRequestURI());
        Permission needed = needed(request.getMethod(), path);
        if (needed == null) {
            return true;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal user)) {
            // Not signed in: the security chain has already answered, or will.
            return true;
        }
        if (permissionService.can(user, needed)) {
            return true;
        }
        refuse(response, needed);
        return false;
    }

    private static String decoded(String path) {
        try {
            return UriUtils.decode(path, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return path; // not valid percent-encoding: no controller matches it either
        }
    }

    /** The same shape as every other refusal, with words the person can act on. */
    public static void refuse(HttpServletResponse response, Permission permission) throws Exception {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"" + message(permission) + "\",\"data\":null}");
    }

    public static String message(Permission permission) {
        return "You do not have permission for this (" + permission.label()
                + "). Ask the administrator to allow it.";
    }
}
