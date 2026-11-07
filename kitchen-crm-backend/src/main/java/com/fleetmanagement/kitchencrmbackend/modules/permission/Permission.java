package com.fleetmanagement.kitchencrmbackend.modules.permission;

import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Everything the administrator can allow or refuse per staff type. The label and description are
 * what the Permissions page shows, so they are written for the administrator, not for developers.
 *
 * <p>The default is what a staff type gets until the administrator decides otherwise. Defaults
 * keep what staff could already do, with these exceptions: deleting a customer is off, and so is
 * deleting a quotation folder (which had no rule at all), an Appliance &amp; Quartz entry or an
 * architect (both can never be undone).
 *
 * <p>{@code screenOnly} marks permissions that only hide something on the screen. They cannot be
 * enforced by the server because the action itself happens in the browser (ticking rows, building
 * a CSV from rows already shown).
 *
 * <p>{@code requires} names the permission this one only works together with: "Add vendors" is
 * nothing without "See vendors", and what may be changed on a production job means nothing to
 * someone who may not open the job. Switching the required one off switches this one off too,
 * without losing what the administrator set for it.
 *
 * <p>{@code appliesTo} lists the staff types a permission means anything for, when that is not all
 * of them. Some work belongs to one type in the code itself — only Admin staff hand out quotations,
 * only a designer starts and hands in a design — so for the other types there is nothing to switch.
 * They never have it, and the page shows no switch for them.
 */
public enum Permission {

    CUSTOMERS_VIEW("customers.view", "Customers", "See customer details",
            "Open the Customers pages and see phone, email, address and history. Without it only the "
                    + "customer's name is shown where one has to be picked.", true, false),
    CUSTOMERS_ADD("customers.add", "Customers", "Add customers",
            "Create a new customer.", true, false),
    CUSTOMERS_EDIT("customers.edit", "Customers", "Edit customers",
            "Change a customer's details.", true, false),
    CUSTOMERS_DELETE("customers.delete", "Customers", "Delete customers",
            "Delete a customer for good, together with their history.", false, false),
    CUSTOMERS_CHANGE_STAGE("customers.change_stage", "Customers", "Change stage",
            "Move a customer to another stage, and choose the stage of a new customer.", true, false),
    CUSTOMERS_BULK("customers.bulk", "Customers", "Select many at once",
            "Tick several customers in the list and act on all of them. Each action still needs its "
                    + "own permission.", true, true),
    CUSTOMERS_EXPORT("customers.export", "Customers", "Export customers",
            "Download the selected customers as a file.", true, true),
    CUSTOMERS_FOLLOWUPS("customers.followups", "Customers", "Follow-ups",
            "See, add and delete their own follow-ups on a customer.", true, false),
    CUSTOMERS_NOTES("customers.notes", "Customers", "Notes",
            "Add a note to a customer's activity.", true, false),
    CUSTOMERS_REMINDERS("customers.reminders", "Customers", "Reminders",
            "Set reminders on a customer and open the Reminders tab.", true, false),
    CUSTOMERS_UPLOAD_DESIGN("customers.upload_design", "Customers", "Upload design",
            "Upload a customer's existing design. While a designer is working on it, only the administrator and Admin staff can.",
            true, false),
    CUSTOMERS_SITE_MEASUREMENT("customers.site_measurement", "Customers", "Site measurement",
            "Open and save a customer's site measurement.", true, false),
    CUSTOMERS_QUOTATIONS("customers.quotations", "Customers", "Customer's quotations",
            "See the list of a customer's quotations on the customer page.", true, false),

    QUOTATIONS_VIEW("quotations.view", "Quotations", "See quotations",
            "Open the Quotations page and any quotation on it. Without it the page is closed.", true, false),
    QUOTATIONS_CREATE("quotations.create", "Quotations", "Create quotations",
            "Make a new quotation, save one as a new version, or duplicate one.", true, false),
    QUOTATIONS_EDIT("quotations.edit", "Quotations", "Edit quotations",
            "Change and save a quotation that is still open, and rename its folder.", true, false),
    QUOTATIONS_DELETE("quotations.delete", "Quotations", "Delete quotations",
            "Delete a quotation, or a whole folder with all its versions, for good.", false, false),
    QUOTATIONS_CHANGE_STATUS("quotations.change_status", "Quotations", "Change status",
            "Set a quotation's status: on hold, approved, completed, cancelled.", false, false),
    QUOTATIONS_PDF("quotations.pdf", "Quotations", "Download PDF",
            "Download or print a quotation as a PDF.", true, false),
    QUOTATIONS_SEE_RATES("quotations.see_rates", "Quotations", "See rates and amount before margin",
            "Each item's rate, and each category's total before the margin is added. With the final "
                    + "amount next to it, the margin can be worked out.", false, false),
    QUOTATIONS_SEE_MARGINS("quotations.see_margins", "Quotations", "See margin codes",
            "The margin of each category as the code the administrator set (for example R), never the "
                    + "percentage. The administrator always sees the percentages.", false, false),
    QUOTATIONS_EDIT_MARGINS("quotations.edit_margins", "Quotations", "Choose margin codes",
            "Choose a margin code for each category on a quotation. Only works together with "
                    + "\"See margin codes\".", false, false),

    QUOTATIONS_SEND_FOR_APPROVAL("quotations.send_for_approval", "Quotations", "Send for customer approval",
            "Send a quotation to the customer to approve and sign online.", true, false, "quotations.view"),

    // ---- the quotation work board (who prepares which quotation)
    QUOTATION_WORK_VIEW("quotation_work.view", "Quotation work", "See the work board",
            "Open the work board on the Quotations page. Admin staff see everyone's work, others only "
                    + "the quotations given to them.", true, false, "quotations.view"),
    QUOTATION_WORK_PREPARE("quotation_work.prepare", "Quotation work", "Prepare quotations given to them",
            "Start a quotation they were given and hand it in as completed.", true, false, "quotation_work.view"),
    QUOTATION_WORK_ASSIGN("quotation_work.assign", "Quotation work", "Give out quotations",
            "Give a customer's quotation to someone to prepare.", true, false, "quotation_work.view",
            Set.of("ADMIN_STAFF")),
    QUOTATION_WORK_CHANGE("quotation_work.change", "Quotation work", "Change given work",
            "Change the priority, due date or note of given work, and the order. Giving it to someone "
                    + "else also needs \"Give out quotations\".",
            true, false, "quotation_work.view", Set.of("ADMIN_STAFF")),
    QUOTATION_WORK_REMOVE("quotation_work.remove", "Quotation work", "Take work off the board",
            "Remove a piece of work from the board.", true, false, "quotation_work.view", Set.of("ADMIN_STAFF")),

    APPLIANCE_VIEW("appliance.view", "Appliance & Quartz", "See entries",
            "Open the Appliance & Quartz page and see its entries.", true, false),
    APPLIANCE_ADD("appliance.add", "Appliance & Quartz", "Add entries",
            "Create a new entry.", true, false, "appliance.view"),
    APPLIANCE_EDIT("appliance.edit", "Appliance & Quartz", "Edit entries",
            "Change an entry, including its stage and amount.", true, false, "appliance.view"),
    APPLIANCE_DELETE("appliance.delete", "Appliance & Quartz", "Delete entries",
            "Delete an entry for good, together with its call notes and reminders.", false, false, "appliance.view"),
    APPLIANCE_FILES("appliance.files", "Appliance & Quartz", "Quotation PDFs",
            "Attach quotation PDFs to an entry and remove them.", true, false, "appliance.view"),
    APPLIANCE_FOLLOWUPS("appliance.followups", "Appliance & Quartz", "Follow-ups",
            "See, add and delete their own call notes on an entry.", true, false, "appliance.view"),
    APPLIANCE_REMINDERS("appliance.reminders", "Appliance & Quartz", "Reminders",
            "See and set their own reminders on an entry.", true, false, "appliance.view"),

    // Adding a reminder is decided by what it is on: Customers, Appliance & Quartz and Architects each
    // have their own Reminders permission. Every reminder is on one of them.
    REMINDERS_VIEW("reminders.view", "Reminders", "See the Reminders page",
            "Open the Reminders page with their reminders. The bell keeps showing reminders that are due.",
            true, false),
    REMINDERS_EDIT("reminders.edit", "Reminders", "Change reminders",
            "Change the date, time or text of their own reminders.", true, false),
    REMINDERS_DONE("reminders.done", "Reminders", "Mark reminders done",
            "Tick off their own reminders, on the Reminders page and from the bell.", true, false),
    REMINDERS_DELETE("reminders.delete", "Reminders", "Delete reminders",
            "Delete their own reminders.", true, false),

    TASKS_TODOS("tasks.todos", "To-dos and tasks", "Own to-do list",
            "Keep a to-do list of their own on the Reminders page.", true, false),
    TASKS_MINE("tasks.mine", "To-dos and tasks", "Tasks given to them",
            "See the tasks the administrator gave them, reply to them and mark them done.", true, false),

    DESIGNS_VIEW("designs.view", "Designs", "See designs",
            "Open the Designs page. Admin staff see every design, a designer only the designs given to them.",
            true, false, null, Set.of("ADMIN_STAFF", "DESIGNER")),
    DESIGNS_ADD_PLANS("designs.add_plans", "Designs", "Add plan documents",
            "Add the customer's plan documents for the designer.", true, false, null, Set.of("ADMIN_STAFF")),
    DESIGNS_UPLOAD_FILES("designs.upload_files", "Designs", "Upload design files",
            "A designer uploads files to their own open design. Admin staff can upload a design only "
                    + "together with \"Upload design\" under Customers.", true, false, "designs.view",
            Set.of("ADMIN_STAFF", "DESIGNER")),
    DESIGNS_REMOVE_FILES("designs.remove_files", "Designs", "Remove files",
            "Remove plan documents or design files they may remove: a designer from their own open design, "
                    + "Admin staff what they uploaded themselves.", true, false, "designs.view",
            Set.of("ADMIN_STAFF", "DESIGNER")),
    DESIGNS_WORK("designs.work", "Designs", "Start and hand in designs",
            "Start working on a design given to them and hand it in for approval.", true, false, "designs.view",
            Set.of("DESIGNER")),
    DESIGNS_CONVERSATION("designs.conversation", "Designs", "Design conversation",
            "Write in the conversation with the administrator on a design given to them.", true, false,
            "designs.view", Set.of("DESIGNER")),

    PRODUCTION_VIEW("production.view", "Production", "See the Production page",
            "Open the Production page with the list of all production jobs.", true, false),
    // The key stays customers.production: what the administrator already decided is stored under it.
    CUSTOMERS_PRODUCTION("customers.production", "Production", "Open production jobs",
            "See a customer's production: stages, tasks and pending works, on the customer page and from "
                    + "the Production page. What they may change is set by the permissions below.", true, false),
    PRODUCTION_START("production.start", "Production", "Start production",
            "Start production for a customer and add the standard stages.", true, false, "customers.production"),
    PRODUCTION_TICK("production.tick", "Production", "Tick off tasks",
            "Mark production tasks done or not done.", true, false, "customers.production"),
    PRODUCTION_CHECKLIST("production.checklist", "Production", "Change the checklist",
            "Add, rename, date and reorder production stages and tasks.", true, false, "customers.production"),
    PRODUCTION_CHECKLIST_DELETE("production.checklist_delete", "Production", "Delete stages and tasks",
            "Delete production stages and tasks.", true, false, "customers.production"),
    PRODUCTION_REMINDERS("production.reminders", "Production", "Task reminders",
            "Set a reminder on a production task.", true, false, "customers.production"),
    PRODUCTION_PENDING_WORKS("production.pending_works", "Production", "Pending works",
            "Report, change, resolve and delete pending works.", true, false, "customers.production"),
    PRODUCTION_EDIT_JOB("production.edit_job", "Production", "Edit job details",
            "Change a job's details, dates, site visits and quality checks. Handover stays with the "
                    + "administrator.", true, false, "customers.production"),

    PRODUCTS_VIEW("products.view", "Products", "See the product catalogue",
            "Open the Products page. Quotations still use the catalogue either way.", true, true),

    VENDORS_VIEW("vendors.view", "Vendors", "See vendors",
            "Open the Vendors page and see vendors' details.", true, false),
    VENDORS_ADD("vendors.add", "Vendors", "Add vendors",
            "Create a new vendor.", true, false, "vendors.view"),
    VENDORS_EDIT("vendors.edit", "Vendors", "Edit vendors",
            "Change a vendor's details. Making a vendor inactive or active again also needs "
                    + "\"Deactivate vendors\".", true, false, "vendors.view"),
    VENDORS_DEACTIVATE("vendors.deactivate", "Vendors", "Deactivate vendors",
            "Make a vendor inactive, or active again.", true, false, "vendors.view"),

    ARCHITECTS_VIEW("architects.view", "Architects & builders", "See architects and builders",
            "Open the Architects page and see their phone, email and visits. Without it only names are "
                    + "shown where one has to be picked for a customer.", true, false),
    ARCHITECTS_ADD("architects.add", "Architects & builders", "Add architects and builders",
            "Create a new one, on the Architects page or while filling in a customer.", true, false),
    ARCHITECTS_EDIT("architects.edit", "Architects & builders", "Edit architects and builders",
            "Change their details and star them.", true, false, "architects.view"),
    ARCHITECTS_DELETE("architects.delete", "Architects & builders", "Delete architects and builders",
            "Delete one for good, together with their visits and reminders. Their customers stay but lose "
                    + "the link.", false, false, "architects.view"),
    ARCHITECTS_VISITS("architects.visits", "Architects & builders", "Record visits",
            "Record a visit and remove one.", true, false, "architects.view"),
    ARCHITECTS_REMINDERS("architects.reminders", "Architects & builders", "Reminders",
            "Set their own reminders on an architect or builder.", true, false, "architects.view");

    private static final Map<String, Permission> BY_KEY =
            Arrays.stream(values()).collect(Collectors.toMap(Permission::key, Function.identity()));

    private final String key;
    private final String module;
    private final String label;
    private final String description;
    private final boolean defaultAllowed;
    private final boolean screenOnly;
    /** Key of the permission this one needs as well, or null. A key, not the constant: see {@link #requires()}. */
    private final String requiresKey;
    /** The staff types this means anything for; null for all of them. */
    private final Set<String> appliesTo;

    Permission(String key, String module, String label, String description, boolean defaultAllowed,
               boolean screenOnly) {
        this(key, module, label, description, defaultAllowed, screenOnly, null, null);
    }

    Permission(String key, String module, String label, String description, boolean defaultAllowed,
               boolean screenOnly, String requiresKey) {
        this(key, module, label, description, defaultAllowed, screenOnly, requiresKey, null);
    }

    Permission(String key, String module, String label, String description, boolean defaultAllowed,
               boolean screenOnly, String requiresKey, Set<String> appliesTo) {
        this.key = key;
        this.module = module;
        this.label = label;
        this.description = description;
        this.defaultAllowed = defaultAllowed;
        this.screenOnly = screenOnly;
        this.requiresKey = requiresKey;
        this.appliesTo = appliesTo;
    }

    public static Permission byKey(String key) {
        return key == null ? null : BY_KEY.get(key);
    }

    public String key() {
        return key;
    }

    public String module() {
        return module;
    }

    public String label() {
        return label;
    }

    public String description() {
        return description;
    }

    public boolean defaultAllowed() {
        return defaultAllowed;
    }

    public boolean screenOnly() {
        return screenOnly;
    }

    /**
     * The permission this one only works together with, or null. Looked up by key when asked, because
     * an enum constant cannot name one that is declared after it.
     */
    public Permission requires() {
        return byKey(requiresKey);
    }

    /** False for a staff type this permission means nothing for: that type never has it. */
    public boolean appliesTo(String staffType) {
        return appliesTo == null || appliesTo.contains(staffType);
    }

    /** The staff types it is limited to, or null when it is for every type. */
    public Set<String> appliesToTypes() {
        return appliesTo;
    }
}
