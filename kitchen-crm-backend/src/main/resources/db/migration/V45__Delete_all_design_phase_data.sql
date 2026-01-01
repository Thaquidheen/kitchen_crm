-- V45__Delete_all_design_phase_data.sql
-- WARNING: This script will delete ALL design phase data including:
-- - All design phases
-- - All design phase files (cascade delete)
-- - Workflow history entries related to design phases

-- Delete workflow history entries related to design phases
-- This removes workflow history entries that mention design phase states
DELETE FROM workflow_history 
WHERE previous_state LIKE '%Design%' 
   OR new_state LIKE '%Design%'
   OR previous_state IN ('PLANNING', 'IN_PROGRESS', 'PENDING_SUPERADMIN_APPROVAL', 'APPROVED_BY_ADMIN', 
                         'SUBMITTED', 'FEEDBACK_RECEIVED', 'REVISION_REQUIRED', 'APPROVED', 'FROZEN', 'CANCELLED')
   OR new_state IN ('PLANNING', 'IN_PROGRESS', 'PENDING_SUPERADMIN_APPROVAL', 'APPROVED_BY_ADMIN', 
                    'SUBMITTED', 'FEEDBACK_RECEIVED', 'REVISION_REQUIRED', 'APPROVED', 'FROZEN', 'CANCELLED')
   OR previous_state LIKE '%Meeting%'
   OR new_state LIKE '%Meeting%'
   OR (change_reason IS NOT NULL AND (change_reason LIKE '%design%' OR change_reason LIKE '%Design%'));

-- Delete all design phase files
-- Note: This should cascade automatically, but we'll do it explicitly to be safe
DELETE FROM design_phase_files;

-- Delete all design phases
DELETE FROM design_phase;

-- Reset auto-increment counters (optional, but good practice)
ALTER TABLE design_phase AUTO_INCREMENT = 1;
ALTER TABLE design_phase_files AUTO_INCREMENT = 1;

