package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionCustomTask;

import java.util.List;

/**
 * The company's standard production SOP, seeded into every new production installation as
 * three task groups. Transcribed from the client's production-stages sheet; the sheet's
 * side-notes ("5 days before delivery", "Sajil, Frice") travel as task descriptions so the
 * guidance sits under the checkbox. Staff names in notes are hints, not assignments.
 *
 * Kept in code rather than a table so it is versioned with the app; per-job checklists stay
 * fully editable after seeding, so changing this template never rewrites existing jobs.
 */
public final class ProductionStageTemplate {

    public record TemplateTask(String title, String note) {}

    public record TemplateStage(String title, String description,
                                ProductionCustomTask.TaskPhase phase, List<TemplateTask> tasks) {}

    private ProductionStageTemplate() {}

    public static final List<TemplateStage> STAGES = List.of(
            new TemplateStage(
                    "Stage 1 · Pre-Production",
                    "Verification, measurement, drawings & client approval",
                    ProductionCustomTask.TaskPhase.PRODUCTION,
                    List.of(
                            new TemplateTask("Advance received date", null),
                            new TemplateTask("Site data and address verification", null),
                            new TemplateTask("Schedule technician for final measurement", null),
                            new TemplateTask("Final measurement received from the technician", null),
                            new TemplateTask("Appliance details received", null),
                            new TemplateTask("Schedule production drawing and electrical drawing for designer", null),
                            new TemplateTask("Prepare requirement sheet and collect quotes from vendors", "Kept as its own sheet per job"),
                            new TemplateTask("Schedule meeting with factory technician", null),
                            new TemplateTask("Share final drawing with client via email", null),
                            new TemplateTask("Obtain client approval about drawing", null),
                            new TemplateTask("Schedule designer to site for electrical and plumbing marking", null)
                    )),
            new TemplateStage(
                    "Stage 2 · Factory & Installation",
                    "Cabinet production, site verification & cabinet installation",
                    ProductionCustomTask.TaskPhase.INSTALLATION,
                    List.of(
                            new TemplateTask("Share final drawing and cabinet pricing with cabinet factory", null),
                            new TemplateTask("Complete the verification process with the site electrician on 30th day",
                                    "Electrical, plumbing, floor tiling, wall tiling — then inform client about installation"),
                            new TemplateTask("Schedule meeting with site technician at showroom for installation discussion", null),
                            new TemplateTask("Arrange and procure accessories and hardware in factory",
                                    "5 days before delivery — accessories, light and wires"),
                            new TemplateTask("Schedule installation date", "Technician, factory incharge, client"),
                            new TemplateTask("Material delivery at site", "Cabinet, accessories, light & wires"),
                            new TemplateTask("Installation of the cabinet", null)
                    )),
            new TemplateStage(
                    "Stage 3 · Finishing & Handover",
                    "Countertop, doors, appliances, lights & completion certificate",
                    ProductionCustomTask.TaskPhase.COMPLETION,
                    List.of(
                            new TemplateTask("Schedule counter top fabrication team", null),
                            new TemplateTask("Share door requirement data sheet with site technician", null),
                            new TemplateTask("Collect doors final measurement from site technician", null),
                            new TemplateTask("Verify countertop installation completed", null),
                            new TemplateTask("Purchase and arrange door materials to door factory", null),
                            new TemplateTask("Verify door production completed", null),
                            new TemplateTask("Schedule door installation date", "Sajil, Frice"),
                            new TemplateTask("Delivery of door at site and installation", null),
                            new TemplateTask("Schedule delivery of appliances at site", null),
                            new TemplateTask("Schedule appliances technician for appliance installation", "Saji"),
                            new TemplateTask("Verify installation of appliances", null),
                            new TemplateTask("Schedule installation of lights", null),
                            new TemplateTask("Verify light installation completed", null),
                            new TemplateTask("Collect final videos and photos of finished kitchen", null),
                            new TemplateTask("Site verification and confirmation", null),
                            new TemplateTask("Advance materials recollection from site", null),
                            new TemplateTask("Give completion certificate",
                                    "Appliance bill, quartz bill, warranty card, kitchen bill"),
                            new TemplateTask("Follow-ups", null)
                    ))
    );
}
