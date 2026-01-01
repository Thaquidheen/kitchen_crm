-- V36: Create customer_requirements table
-- Purpose: Store structured customer requirements for kitchen design preferences
-- Author: HOCH Team
-- Date: 2025-01-20

CREATE TABLE IF NOT EXISTS customer_requirements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL UNIQUE,
    
    -- 1. Cabinet Type (2 fields)
    cabinet_wpc BOOLEAN DEFAULT FALSE,
    cabinet_ss BOOLEAN DEFAULT FALSE,
    
    -- 2. Door Material (2 fields)
    door_wpc BOOLEAN DEFAULT FALSE,
    door_ss BOOLEAN DEFAULT FALSE,
    
    -- 3. Finish Options (5 fields)
    finish_glax BOOLEAN DEFAULT FALSE,
    finish_ceramic BOOLEAN DEFAULT FALSE,
    finish_glass BOOLEAN DEFAULT FALSE,
    finish_pu BOOLEAN DEFAULT FALSE,
    finish_laminate BOOLEAN DEFAULT FALSE,
    
    -- 4. Layout Options (7 fields)
    layout_l_shape BOOLEAN DEFAULT FALSE,
    layout_u_shape BOOLEAN DEFAULT FALSE,
    layout_c_shape BOOLEAN DEFAULT FALSE,
    layout_g_shape BOOLEAN DEFAULT FALSE,
    layout_island BOOLEAN DEFAULT FALSE,
    layout_linear BOOLEAN DEFAULT FALSE,
    layout_parallel BOOLEAN DEFAULT FALSE,
    
    -- 5. Design Features (4 fields)
    design_island BOOLEAN DEFAULT FALSE,
    design_breakfast BOOLEAN DEFAULT FALSE,
    design_bar_unit BOOLEAN DEFAULT FALSE,
    design_pantry_unit BOOLEAN DEFAULT FALSE,
    
    -- 6. Cabinets and Storage (4 fields)
    cabinet_tall_units BOOLEAN DEFAULT FALSE,
    cabinet_base_units BOOLEAN DEFAULT FALSE,
    cabinet_wall_units BOOLEAN DEFAULT FALSE,
    cabinet_loft_units BOOLEAN DEFAULT FALSE,
    
    -- 7. Base Units (4 fields)
    base_drawers BOOLEAN DEFAULT FALSE,
    base_hinge_doors BOOLEAN DEFAULT FALSE,
    base_pullouts BOOLEAN DEFAULT FALSE,
    base_wicker_basket BOOLEAN DEFAULT FALSE,
    
    -- 8. Wall Unit Options (6 fields)
    wall_unit_imove BOOLEAN DEFAULT FALSE,
    wall_hinge_doors BOOLEAN DEFAULT FALSE,
    wall_bifold_liftup BOOLEAN DEFAULT FALSE,
    wall_bifold_motorised BOOLEAN DEFAULT FALSE,
    wall_flapup BOOLEAN DEFAULT FALSE,
    wall_rolling_shutter BOOLEAN DEFAULT FALSE,
    
    -- 9. Tall Unit Options (4 fields)
    tall_unit_pantry_pullout BOOLEAN DEFAULT FALSE,
    lavido_pullout BOOLEAN DEFAULT FALSE,
    tall_unit_ss_shelves BOOLEAN DEFAULT FALSE,
    tall_unit_glass_shelf BOOLEAN DEFAULT FALSE,
    
    -- 10. Handles (6 fields)
    handle_g BOOLEAN DEFAULT FALSE,
    handle_j BOOLEAN DEFAULT FALSE,
    handle_gola BOOLEAN DEFAULT FALSE,
    handle_lip_profile BOOLEAN DEFAULT FALSE,
    handle_expose_handless BOOLEAN DEFAULT FALSE,
    inbuilt_handles BOOLEAN DEFAULT FALSE,
    
    -- 11. Handle Colors (4 fields)
    handle_color_rose_gold BOOLEAN DEFAULT FALSE,
    handle_color_silver BOOLEAN DEFAULT FALSE,
    handle_color_gold BOOLEAN DEFAULT FALSE,
    handle_color_black BOOLEAN DEFAULT FALSE,
    
    -- 12. Lighting (1 field)
    profile_lights BOOLEAN DEFAULT FALSE,
    
    -- 13. Ovens (2 fields)
    oven_built_in BOOLEAN DEFAULT FALSE,
    oven_free_standing BOOLEAN DEFAULT FALSE,
    
    -- 14. Refrigerators (2 fields)
    refrigerator_built_in BOOLEAN DEFAULT FALSE,
    refrigerator_free_standing BOOLEAN DEFAULT FALSE,
    
    -- 15. Dishwashers (2 fields)
    dishwasher_built_in BOOLEAN DEFAULT FALSE,
    dishwasher_free_standing BOOLEAN DEFAULT FALSE,
    
    -- 16. Coffee Makers (2 fields)
    coffee_maker_built_in BOOLEAN DEFAULT FALSE,
    coffee_maker_free_standing BOOLEAN DEFAULT FALSE,
    
    -- 17. Cook Tops (3 fields)
    cook_top_90 BOOLEAN DEFAULT FALSE,
    cook_top_60 BOOLEAN DEFAULT FALSE,
    cook_top_120 BOOLEAN DEFAULT FALSE,
    
    -- 18. Sinks and Faucets (4 fields)
    sink_double_bowl BOOLEAN DEFAULT FALSE,
    sink_single_bowl BOOLEAN DEFAULT FALSE,
    sink_double_with_drain BOOLEAN DEFAULT FALSE,
    sink_multifunction BOOLEAN DEFAULT FALSE,
    
    -- 19. Sinks and Faucets Base Unit (6 fields)
    sink_base_drawers BOOLEAN DEFAULT FALSE,
    sink_base_doors BOOLEAN DEFAULT FALSE,
    sink_base_waste_bin BOOLEAN DEFAULT FALSE,
    sink_base_detergent_holder BOOLEAN DEFAULT FALSE,
    sink_base_detergent_pullouts BOOLEAN DEFAULT FALSE,
    sink_base_wastebin_pullout BOOLEAN DEFAULT FALSE,
    
    -- 20. Corner Solutions (3 fields)
    corner_solution_lemans BOOLEAN DEFAULT FALSE,
    corner_solution_magic_corner BOOLEAN DEFAULT FALSE,
    corner_solution_shelves BOOLEAN DEFAULT FALSE,
    
    -- 21. Built-in Sinks (2 fields)
    built_in_sink_over_counter BOOLEAN DEFAULT FALSE,
    built_in_sink_under_counter BOOLEAN DEFAULT FALSE,
    
    -- 22. Countertops (3 fields)
    countertop_quartz BOOLEAN DEFAULT FALSE,
    countertop_granite BOOLEAN DEFAULT FALSE,
    countertop_tiles BOOLEAN DEFAULT FALSE,
    
    -- 23. Timeline (3 fields)
    timeline_45_60_days BOOLEAN DEFAULT FALSE,
    timeline_60_90_days BOOLEAN DEFAULT FALSE,
    timeline_above_90_days BOOLEAN DEFAULT FALSE,
    
    -- 24. Text Fields (3 fields)
    aesthetics_and_colors TEXT,
    interior_designer TEXT,
    comments TEXT,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- Foreign key constraint
    CONSTRAINT fk_customer_requirements_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON DELETE CASCADE,
    
    -- Index for faster lookups
    INDEX idx_customer_requirements_customer_id (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


