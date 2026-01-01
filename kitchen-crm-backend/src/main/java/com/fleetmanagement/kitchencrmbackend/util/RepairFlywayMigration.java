package com.fleetmanagement.kitchencrmbackend.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Utility to repair failed Flyway migration V35
 * Run this once: mvn spring-boot:run -Dspring-boot.run.arguments=--repair.flyway.v35
 * Or run the main method directly
 */
@Component
public class RepairFlywayMigration implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        if (args.length > 0 && args[0].equals("--repair.flyway.v35")) {
            repairMigrationV35();
        }
    }

    public void repairMigrationV35() {
        try {
            System.out.println("Repairing failed Flyway migration V35...");
            
            // Delete failed migration record
            int deleted = jdbcTemplate.update(
                "DELETE FROM flyway_schema_history WHERE version = ? AND success = 0",
                "35"
            );
            
            if (deleted > 0) {
                System.out.println("✓ Successfully removed failed migration V35 record");
                System.out.println("  You can now restart the application and migration V35 will run successfully.");
            } else {
                System.out.println("ℹ No failed migration V35 found (may already be cleaned up or never failed)");
            }
            
            // Verify
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = ? AND success = 0",
                Integer.class,
                "35"
            );
            
            if (count == 0) {
                System.out.println("✓ Verification passed: No failed migration V35 records found");
            }
            
        } catch (Exception e) {
            System.err.println("✗ Error repairing migration: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        // This can be run directly if needed
        System.out.println("Please run this via Spring Boot:");
        System.out.println("mvn spring-boot:run -Dspring-boot.run.arguments=--repair.flyway.v35");
    }
}




