package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "customer_requirements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerRequirements extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    private Customer customer;

    // 1. Cabinet Type (2 fields)
    @Column(name = "cabinet_wpc")
    private Boolean cabinetWpc = false;

    @Column(name = "cabinet_ss")
    private Boolean cabinetSs = false;

    // 2. Door Material (2 fields)
    @Column(name = "door_wpc")
    private Boolean doorWpc = false;

    @Column(name = "door_ss")
    private Boolean doorSs = false;

    // 3. Finish Options (5 fields)
    @Column(name = "finish_glax")
    private Boolean finishGlax = false;

    @Column(name = "finish_ceramic")
    private Boolean finishCeramic = false;

    @Column(name = "finish_glass")
    private Boolean finishGlass = false;

    @Column(name = "finish_pu")
    private Boolean finishPu = false;

    @Column(name = "finish_laminate")
    private Boolean finishLaminate = false;

    // 4. Layout Options (7 fields)
    @Column(name = "layout_l_shape")
    private Boolean layoutLShape = false;

    @Column(name = "layout_u_shape")
    private Boolean layoutUShape = false;

    @Column(name = "layout_c_shape")
    private Boolean layoutCShape = false;

    @Column(name = "layout_g_shape")
    private Boolean layoutGShape = false;

    @Column(name = "layout_island")
    private Boolean layoutIsland = false;

    @Column(name = "layout_linear")
    private Boolean layoutLinear = false;

    @Column(name = "layout_parallel")
    private Boolean layoutParallel = false;

    // 5. Design Features (4 fields)
    @Column(name = "design_island")
    private Boolean designIsland = false;

    @Column(name = "design_breakfast")
    private Boolean designBreakfast = false;

    @Column(name = "design_bar_unit")
    private Boolean designBarUnit = false;

    @Column(name = "design_pantry_unit")
    private Boolean designPantryUnit = false;

    // 6. Cabinets and Storage (4 fields)
    @Column(name = "cabinet_tall_units")
    private Boolean cabinetTallUnits = false;

    @Column(name = "cabinet_base_units")
    private Boolean cabinetBaseUnits = false;

    @Column(name = "cabinet_wall_units")
    private Boolean cabinetWallUnits = false;

    @Column(name = "cabinet_loft_units")
    private Boolean cabinetLoftUnits = false;

    // 7. Base Units (4 fields)
    @Column(name = "base_drawers")
    private Boolean baseDrawers = false;

    @Column(name = "base_hinge_doors")
    private Boolean baseHingeDoors = false;

    @Column(name = "base_pullouts")
    private Boolean basePullouts = false;

    @Column(name = "base_wicker_basket")
    private Boolean baseWickerBasket = false;

    // 8. Wall Unit Options (6 fields)
    @Column(name = "wall_unit_imove")
    private Boolean wallUnitImove = false;

    @Column(name = "wall_hinge_doors")
    private Boolean wallHingeDoors = false;

    @Column(name = "wall_bifold_liftup")
    private Boolean wallBifoldLiftup = false;

    @Column(name = "wall_bifold_motorised")
    private Boolean wallBifoldMotorised = false;

    @Column(name = "wall_flapup")
    private Boolean wallFlapup = false;

    @Column(name = "wall_rolling_shutter")
    private Boolean wallRollingShutter = false;

    // 9. Tall Unit Options (4 fields)
    @Column(name = "tall_unit_pantry_pullout")
    private Boolean tallUnitPantryPullout = false;

    @Column(name = "lavido_pullout")
    private Boolean lavidoPullout = false;

    @Column(name = "tall_unit_ss_shelves")
    private Boolean tallUnitSsShelves = false;

    @Column(name = "tall_unit_glass_shelf")
    private Boolean tallUnitGlassShelf = false;

    // 10. Handles (6 fields)
    @Column(name = "handle_g")
    private Boolean handleG = false;

    @Column(name = "handle_j")
    private Boolean handleJ = false;

    @Column(name = "handle_gola")
    private Boolean handleGola = false;

    @Column(name = "handle_lip_profile")
    private Boolean handleLipProfile = false;

    @Column(name = "handle_expose_handless")
    private Boolean handleExposeHandless = false;

    @Column(name = "inbuilt_handles")
    private Boolean inbuiltHandles = false;

    // 11. Handle Colors (4 fields)
    @Column(name = "handle_color_rose_gold")
    private Boolean handleColorRoseGold = false;

    @Column(name = "handle_color_silver")
    private Boolean handleColorSilver = false;

    @Column(name = "handle_color_gold")
    private Boolean handleColorGold = false;

    @Column(name = "handle_color_black")
    private Boolean handleColorBlack = false;

    // 12. Lighting (1 field)
    @Column(name = "profile_lights")
    private Boolean profileLights = false;

    // 13. Ovens (2 fields)
    @Column(name = "oven_built_in")
    private Boolean ovenBuiltIn = false;

    @Column(name = "oven_free_standing")
    private Boolean ovenFreeStanding = false;

    // 14. Refrigerators (2 fields)
    @Column(name = "refrigerator_built_in")
    private Boolean refrigeratorBuiltIn = false;

    @Column(name = "refrigerator_free_standing")
    private Boolean refrigeratorFreeStanding = false;

    // 15. Dishwashers (2 fields)
    @Column(name = "dishwasher_built_in")
    private Boolean dishwasherBuiltIn = false;

    @Column(name = "dishwasher_free_standing")
    private Boolean dishwasherFreeStanding = false;

    // 16. Coffee Makers (2 fields)
    @Column(name = "coffee_maker_built_in")
    private Boolean coffeeMakerBuiltIn = false;

    @Column(name = "coffee_maker_free_standing")
    private Boolean coffeeMakerFreeStanding = false;

    // 17. Cook Tops (3 fields)
    @Column(name = "cook_top_90")
    private Boolean cookTop90 = false;

    @Column(name = "cook_top_60")
    private Boolean cookTop60 = false;

    @Column(name = "cook_top_120")
    private Boolean cookTop120 = false;

    // 18. Sinks and Faucets (4 fields)
    @Column(name = "sink_double_bowl")
    private Boolean sinkDoubleBowl = false;

    @Column(name = "sink_single_bowl")
    private Boolean sinkSingleBowl = false;

    @Column(name = "sink_double_with_drain")
    private Boolean sinkDoubleWithDrain = false;

    @Column(name = "sink_multifunction")
    private Boolean sinkMultifunction = false;

    // 19. Sinks and Faucets Base Unit (6 fields)
    @Column(name = "sink_base_drawers")
    private Boolean sinkBaseDrawers = false;

    @Column(name = "sink_base_doors")
    private Boolean sinkBaseDoors = false;

    @Column(name = "sink_base_waste_bin")
    private Boolean sinkBaseWasteBin = false;

    @Column(name = "sink_base_detergent_holder")
    private Boolean sinkBaseDetergentHolder = false;

    @Column(name = "sink_base_detergent_pullouts")
    private Boolean sinkBaseDetergentPullouts = false;

    @Column(name = "sink_base_wastebin_pullout")
    private Boolean sinkBaseWastebinPullout = false;

    // 20. Corner Solutions (3 fields)
    @Column(name = "corner_solution_lemans")
    private Boolean cornerSolutionLemans = false;

    @Column(name = "corner_solution_magic_corner")
    private Boolean cornerSolutionMagicCorner = false;

    @Column(name = "corner_solution_shelves")
    private Boolean cornerSolutionShelves = false;

    // 21. Built-in Sinks (2 fields)
    @Column(name = "built_in_sink_over_counter")
    private Boolean builtInSinkOverCounter = false;

    @Column(name = "built_in_sink_under_counter")
    private Boolean builtInSinkUnderCounter = false;

    // 22. Countertops (3 fields)
    @Column(name = "countertop_quartz")
    private Boolean countertopQuartz = false;

    @Column(name = "countertop_granite")
    private Boolean countertopGranite = false;

    @Column(name = "countertop_tiles")
    private Boolean countertopTiles = false;

    // 23. Timeline (3 fields)
    @Column(name = "timeline_45_60_days")
    private Boolean timeline4560Days = false;

    @Column(name = "timeline_60_90_days")
    private Boolean timeline6090Days = false;

    @Column(name = "timeline_above_90_days")
    private Boolean timelineAbove90Days = false;

    // 24. Text Fields (3 fields)
    @Column(name = "aesthetics_and_colors", columnDefinition = "TEXT")
    private String aestheticsAndColors;

    @Column(name = "interior_designer", columnDefinition = "TEXT")
    private String interiorDesigner;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;
}


