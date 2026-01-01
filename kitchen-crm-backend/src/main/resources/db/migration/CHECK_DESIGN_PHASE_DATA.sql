-- CHECK_DESIGN_PHASE_DATA.sql
-- Run this script to check if design phase data exists in the database
-- This is a diagnostic script, not a migration

-- Check total count of design phases
SELECT COUNT(*) as total_design_phases FROM design_phase;

-- List all design phases with basic info
SELECT 
    dp.id,
    dp.customer_id,
    c.name as customer_name,
    dp.design_status,
    dp.staff_assigned_id,
    u.name as staff_name,
    dp.designer_id,
    d.name as designer_name,
    dp.created_at,
    dp.updated_at
FROM design_phase dp
LEFT JOIN customers c ON dp.customer_id = c.id
LEFT JOIN users u ON dp.staff_assigned_id = u.id
LEFT JOIN designers d ON dp.designer_id = d.id
ORDER BY dp.created_at DESC;

-- Check design phases by status
SELECT 
    design_status,
    COUNT(*) as count
FROM design_phase
GROUP BY design_status;

-- Check design phases with staff assignments
SELECT 
    dp.id,
    c.name as customer_name,
    u.name as staff_name,
    dp.design_status
FROM design_phase dp
LEFT JOIN customers c ON dp.customer_id = c.id
LEFT JOIN users u ON dp.staff_assigned_id = u.id
WHERE dp.staff_assigned_id IS NOT NULL;

-- Check design phases without staff assignments
SELECT 
    dp.id,
    c.name as customer_name,
    dp.design_status
FROM design_phase dp
LEFT JOIN customers c ON dp.customer_id = c.id
WHERE dp.staff_assigned_id IS NULL;





