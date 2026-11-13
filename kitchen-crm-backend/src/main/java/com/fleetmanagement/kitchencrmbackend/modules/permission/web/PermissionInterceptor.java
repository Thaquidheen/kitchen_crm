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
 * <p>Some things cannot be decided from the address alone and are checked where they happen:
 * what a person without {@code customers.view} or {@code architects.view} gets back (CustomerController
 * and ArchitectController trim the answer), and what depends on what is sent — adding a reminder
 * (by what it is on), a design upload, and making a vendor inactive through an edit (their
 * controllers ask).
 *
 * <p>A rule can only refuse. Where the controller itself keeps something to the administrator or
 * to one staff type, a permission switched on does not open it.
 */
@Component
public class PermissionInterceptor implements HandlerInterceptor {

    private static final Set<String> ANY = Set.of("GET", "POST", "PUT", "PATCH", "DELETE");
    private static final Set<String> READ = Set.of("GET");
    private static final Set<String> WRITE = Set.of("POST", "PUT", "PATCH", "DELETE");

    /**
     * methods, address pattern, permission needed. A null permission marks an address that stays
     * open on purpose: it stops the search, so a broader rule below cannot catch it. That is how a
     * one-segment rule for "any id" ('*') lives next to fixed addresses such as /me. A digits-only
     * pattern cannot do that job: Spring also reads "0x5", "+5" or " 5" as the id 5, and those
     * would match no rule at all.
     */
    record Rule(Set<String> methods, String pattern, Permission permission) {
    }

    static final List<Rule> RULES = List.of(
            // ---- customers: the record itself
            new Rule(Set.of("PATCH"), "/api/v1/customers/*/status", Permission.CUSTOMERS_CHANGE_STAGE),
            // the star is part of the customer's record: whoever may edit the customer sets it
            new Rule(Set.of("PATCH"), "/api/v1/customers/*/highlight", Permission.CUSTOMERS_EDIT),
            // what a stage change would do to the customer's quotations: asked by whoever changes the stage
            new Rule(READ, "/api/v1/customers/*/quotation-effects", Permission.CUSTOMERS_CHANGE_STAGE),
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
            // Deleting cancelled quotations in bulk is a POST: listed before the create rule.
            new Rule(Set.of("POST"), "/api/v1/quotations/bulk-delete", Permission.QUOTATIONS_DELETE),
            new Rule(Set.of("DELETE"), "/api/v1/quotations/folders/*", Permission.QUOTATIONS_DELETE),
            new Rule(Set.of("DELETE"), "/api/v1/quotations/*", Permission.QUOTATIONS_DELETE),
            new Rule(Set.of("PATCH"), "/api/v1/quotations/*/status", Permission.QUOTATIONS_CHANGE_STATUS),
            new Rule(READ, "/api/v1/quotations/*/pdf", Permission.QUOTATIONS_PDF),
            // Pricing without saving (staff's figures while they edit): the permission of the save.
            new Rule(Set.of("POST"), "/api/v1/quotations/preview", Permission.QUOTATIONS_CREATE),
            new Rule(Set.of("POST"), "/api/v1/quotations/*/preview", Permission.QUOTATIONS_EDIT),
            new Rule(Set.of("POST"), "/api/v1/quotations", Permission.QUOTATIONS_CREATE),
            new Rule(Set.of("POST"), "/api/v1/quotations/*/duplicate", Permission.QUOTATIONS_CREATE),
            new Rule(Set.of("PUT"), "/api/v1/quotations/folders/*", Permission.QUOTATIONS_EDIT),
            new Rule(Set.of("PUT"), "/api/v1/quotations/*", Permission.QUOTATIONS_EDIT),
            new Rule(READ, "/api/v1/quotations", Permission.QUOTATIONS_VIEW),
            new Rule(READ, "/api/v1/quotations/**", Permission.QUOTATIONS_VIEW),
            // ---- customer approval of a quotation: the two calls the Digital Signature panel makes
            // (and the approved PDF's download). Everything else under /signatures is the
            // administrator's on the controller.
            new Rule(Set.of("POST"), "/api/v1/signatures/quotations/*/send-for-signature",
                    Permission.QUOTATIONS_SEND_FOR_APPROVAL),
            new Rule(READ, "/api/v1/signatures/quotations/*/documents", Permission.QUOTATIONS_VIEW),
            new Rule(READ, "/api/v1/signatures/documents/*/download", Permission.QUOTATIONS_VIEW),

            // ---- the quotation work board. /me, /feed and /seen stay open: the bell and the Quotations
            // page ask them for everyone.
            new Rule(Set.of("PUT"), "/api/v1/quotation-jobs/seen", null),
            new Rule(READ, "/api/v1/quotation-jobs", Permission.QUOTATION_WORK_VIEW),
            new Rule(Set.of("PUT"), "/api/v1/quotation-jobs/*/start", Permission.QUOTATION_WORK_PREPARE),
            new Rule(Set.of("PUT"), "/api/v1/quotation-jobs/*/complete", Permission.QUOTATION_WORK_PREPARE),
            new Rule(Set.of("POST"), "/api/v1/quotation-jobs/assign", Permission.QUOTATION_WORK_ASSIGN),
            new Rule(READ, "/api/v1/quotation-jobs/unassigned", Permission.QUOTATION_WORK_ASSIGN),
            new Rule(READ, "/api/v1/quotation-jobs/assignees", Permission.QUOTATION_WORK_ASSIGN),
            new Rule(Set.of("PUT"), "/api/v1/quotation-jobs/reorder", Permission.QUOTATION_WORK_CHANGE),
            new Rule(Set.of("PUT"), "/api/v1/quotation-jobs/*", Permission.QUOTATION_WORK_CHANGE),
            new Rule(Set.of("PUT"), "/api/v1/quotation-jobs/*/cancel", Permission.QUOTATION_WORK_REMOVE),

            // ---- designs. /me, /designers, /my-feed and the customer's design stay open: the sidebar,
            // the bell and the customer page ask them for everyone. The administrator's own actions
            // (assign, review, redesign) keep their role check on the controller.
            new Rule(READ, "/api/v1/design-jobs/me", null),
            new Rule(READ, "/api/v1/design-jobs/designers", null),
            new Rule(READ, "/api/v1/design-jobs/my-feed", null),
            new Rule(READ, "/api/v1/design-jobs/attention", null),
            new Rule(READ, "/api/v1/design-jobs", Permission.DESIGNS_VIEW),
            new Rule(READ, "/api/v1/design-jobs/*", Permission.DESIGNS_VIEW),
            new Rule(Set.of("POST"), "/api/v1/design-jobs/customer/*/plan-documents", Permission.DESIGNS_ADD_PLANS),
            new Rule(Set.of("POST"), "/api/v1/design-jobs/*/plan-documents", Permission.DESIGNS_ADD_PLANS),
            new Rule(Set.of("POST"), "/api/v1/design-jobs/*/files", Permission.DESIGNS_UPLOAD_FILES),
            new Rule(Set.of("DELETE"), "/api/v1/design-jobs/*/files/*", Permission.DESIGNS_REMOVE_FILES),
            new Rule(Set.of("PUT"), "/api/v1/design-jobs/*/start", Permission.DESIGNS_WORK),
            new Rule(Set.of("PUT"), "/api/v1/design-jobs/*/complete", Permission.DESIGNS_WORK),
            new Rule(Set.of("POST"), "/api/v1/design-jobs/*/notes", Permission.DESIGNS_CONVERSATION),

            // ---- production. Opening a job is customers.production; each kind of change has its own
            // permission, which only works together with it (Permission.requires). Handover and
            // deleting a job keep their administrator check on the controller. The job rules come
            // before the Production page's lists, whose /** would otherwise catch them.
            new Rule(READ, "/api/v1/production-installation/customer/**", Permission.CUSTOMERS_PRODUCTION),
            new Rule(Set.of("POST"), "/api/v1/production-installation/customer/*/apply-standard-stages",
                    Permission.PRODUCTION_START),
            new Rule(WRITE, "/api/v1/production-installation/customer/**", Permission.PRODUCTION_EDIT_JOB),
            new Rule(Set.of("POST"), "/api/v1/production-installation", Permission.PRODUCTION_START),
            new Rule(READ, "/api/v1/production-installation", Permission.PRODUCTION_VIEW),
            new Rule(READ, "/api/v1/production-installation/**", Permission.PRODUCTION_VIEW),
            new Rule(READ, "/api/v1/production/task-groups", Permission.CUSTOMERS_PRODUCTION),
            new Rule(READ, "/api/v1/production/task-groups/**", Permission.CUSTOMERS_PRODUCTION),
            new Rule(Set.of("DELETE"), "/api/v1/production/task-groups/*", Permission.PRODUCTION_CHECKLIST_DELETE),
            new Rule(WRITE, "/api/v1/production/task-groups", Permission.PRODUCTION_CHECKLIST),
            new Rule(WRITE, "/api/v1/production/task-groups/**", Permission.PRODUCTION_CHECKLIST),
            new Rule(READ, "/api/v1/production-custom-tasks", Permission.CUSTOMERS_PRODUCTION),
            new Rule(READ, "/api/v1/production-custom-tasks/**", Permission.CUSTOMERS_PRODUCTION),
            new Rule(Set.of("PATCH"), "/api/v1/production-custom-tasks/*/toggle", Permission.PRODUCTION_TICK),
            new Rule(Set.of("POST"), "/api/v1/production-custom-tasks/*/reminder", Permission.PRODUCTION_REMINDERS),
            new Rule(Set.of("DELETE"), "/api/v1/production-custom-tasks/*", Permission.PRODUCTION_CHECKLIST_DELETE),
            new Rule(WRITE, "/api/v1/production-custom-tasks", Permission.PRODUCTION_CHECKLIST),
            new Rule(WRITE, "/api/v1/production-custom-tasks/**", Permission.PRODUCTION_CHECKLIST),
            new Rule(READ, "/api/v1/production/issues", Permission.CUSTOMERS_PRODUCTION),
            new Rule(READ, "/api/v1/production/issues/**", Permission.CUSTOMERS_PRODUCTION),
            new Rule(WRITE, "/api/v1/production/issues", Permission.PRODUCTION_PENDING_WORKS),
            new Rule(WRITE, "/api/v1/production/issues/**", Permission.PRODUCTION_PENDING_WORKS),

            // ---- Appliance & Quartz
            new Rule(ANY, "/api/v1/appliance-customers/*/followups", Permission.APPLIANCE_FOLLOWUPS),
            new Rule(ANY, "/api/v1/appliance-customers/*/followups/*", Permission.APPLIANCE_FOLLOWUPS),
            new Rule(WRITE, "/api/v1/appliance-customers/*/quotations", Permission.APPLIANCE_FILES),
            new Rule(WRITE, "/api/v1/appliance-customers/*/quotations/*", Permission.APPLIANCE_FILES),
            new Rule(Set.of("POST"), "/api/v1/appliance-customers", Permission.APPLIANCE_ADD),
            new Rule(Set.of("PUT"), "/api/v1/appliance-customers/*", Permission.APPLIANCE_EDIT),
            new Rule(Set.of("DELETE"), "/api/v1/appliance-customers/*", Permission.APPLIANCE_DELETE),
            new Rule(READ, "/api/v1/appliance-customers", Permission.APPLIANCE_VIEW),
            new Rule(READ, "/api/v1/appliance-customers/**", Permission.APPLIANCE_VIEW),
            new Rule(READ, "/api/v1/reminders/appliance/*", Permission.APPLIANCE_REMINDERS),

            // ---- reminders in general. A customer's reminders are above. /notifications stays open
            // (the bell). Adding one is decided by what it is on, in CustomerReminderController.
            new Rule(READ, "/api/v1/reminders", Permission.REMINDERS_VIEW),
            new Rule(READ, "/api/v1/reminders/stats", Permission.REMINDERS_VIEW),
            new Rule(READ, "/api/v1/reminders/open", Permission.REMINDERS_VIEW),
            new Rule(Set.of("PATCH"), "/api/v1/reminders/*/done", Permission.REMINDERS_DONE),
            new Rule(Set.of("PUT"), "/api/v1/reminders/*", Permission.REMINDERS_EDIT),
            new Rule(Set.of("DELETE"), "/api/v1/reminders/*", Permission.REMINDERS_DELETE),

            // ---- to-dos and tasks. The administrator's own task screens keep their role check on
            // the controller; the administrator passes every permission anyway.
            new Rule(ANY, "/api/v1/tasks/admin-todo", Permission.TASKS_TODOS),
            new Rule(ANY, "/api/v1/tasks/admin-todo/**", Permission.TASKS_TODOS),
            new Rule(ANY, "/api/v1/tasks/employee", Permission.TASKS_MINE),
            new Rule(ANY, "/api/v1/tasks/employee/**", Permission.TASKS_MINE),

            // ---- vendors. Making one inactive through an edit is checked in VendorController.
            new Rule(Set.of("POST"), "/api/v1/vendors", Permission.VENDORS_ADD),
            new Rule(Set.of("PUT"), "/api/v1/vendors/*", Permission.VENDORS_EDIT),
            new Rule(Set.of("DELETE"), "/api/v1/vendors/*", Permission.VENDORS_DEACTIVATE),
            new Rule(READ, "/api/v1/vendors", Permission.VENDORS_VIEW),
            new Rule(READ, "/api/v1/vendors/**", Permission.VENDORS_VIEW),

            // ---- architects and builders. /all stays open: the customer form picks one from it, and
            // ArchitectController gives only names to someone without architects.view.
            new Rule(READ, "/api/v1/architects/all", null),
            new Rule(READ, "/api/v1/architects", Permission.ARCHITECTS_VIEW),
            new Rule(READ, "/api/v1/architects/*", Permission.ARCHITECTS_VIEW),
            new Rule(READ, "/api/v1/architects/*/visits", Permission.ARCHITECTS_VIEW),
            new Rule(READ, "/api/v1/architects/*/notes", Permission.ARCHITECTS_VIEW),
            new Rule(Set.of("POST"), "/api/v1/architects/*/visits", Permission.ARCHITECTS_VISITS),
            new Rule(Set.of("POST"), "/api/v1/architects/*/visits/quick", Permission.ARCHITECTS_VISITS),
            new Rule(Set.of("DELETE"), "/api/v1/architects/*/visits/*", Permission.ARCHITECTS_VISITS),
            new Rule(Set.of("POST"), "/api/v1/architects/*/notes", Permission.ARCHITECTS_EDIT),
            new Rule(Set.of("POST"), "/api/v1/architects", Permission.ARCHITECTS_ADD),
            new Rule(Set.of("PUT"), "/api/v1/architects/*", Permission.ARCHITECTS_EDIT),
            new Rule(Set.of("DELETE"), "/api/v1/architects/*", Permission.ARCHITECTS_DELETE)
    );

    private static final AntPathMatcher MATCHER = new AntPathMatcher();

    @Autowired
    private PermissionService permissionService;

    /** The permission this call needs, or null when no rule covers it. */
    static Permission needed(String method, String path) {
        String m = method == null ? "" : method.toUpperCase();
        if ("HEAD".equals(m)) {
            m = "GET"; // Spring answers HEAD with the GET handler: the same rule decides
        }
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
