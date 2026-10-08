package com.fleetmanagement.kitchencrmbackend.modules.permission;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Everything the administrator can allow or refuse per staff type. The label and description are
 * what the Permissions page shows, so they are written for the administrator, not for developers.
 *
 * <p>The default is what a staff type gets until the administrator decides otherwise. Defaults
 * keep what staff could already do, with two exceptions: deleting a customer is off, and so is
 * deleting a quotation folder (which had no rule at all).
 *
 * <p>{@code screenOnly} marks permissions that only hide something on the screen. They cannot be
 * enforced by the server because the action itself happens in the browser (ticking rows, building
 * a CSV from rows already shown).
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
            "Upload a customer's existing design.", true, false),
    CUSTOMERS_SITE_MEASUREMENT("customers.site_measurement", "Customers", "Site measurement",
            "Open and save a customer's site measurement.", true, false),
    CUSTOMERS_PRODUCTION("customers.production", "Customers", "Production",
            "See and update a customer's production: stages, tasks and issues.", true, false),
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
    QUOTATIONS_SEE_MARGINS("quotations.see_margins", "Quotations", "See margin",
            "The margin percentage and margin amount of each category, and the MRP margins.", false, false),
    QUOTATIONS_EDIT_MARGINS("quotations.edit_margins", "Quotations", "Change margin",
            "Set the margin percentages on a quotation. Only works together with \"See margin\".", false, false);

    private static final Map<String, Permission> BY_KEY =
            Arrays.stream(values()).collect(Collectors.toMap(Permission::key, Function.identity()));

    private final String key;
    private final String module;
    private final String label;
    private final String description;
    private final boolean defaultAllowed;
    private final boolean screenOnly;

    Permission(String key, String module, String label, String description, boolean defaultAllowed,
               boolean screenOnly) {
        this.key = key;
        this.module = module;
        this.label = label;
        this.description = description;
        this.defaultAllowed = defaultAllowed;
        this.screenOnly = screenOnly;
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
}
