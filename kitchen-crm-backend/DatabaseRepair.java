import java.sql.*;

public class DatabaseRepair {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/kitchen_crm?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
        String username = "kitchen_crm";
        String password = "password123";

        try (Connection conn = DriverManager.getConnection(url, username, password)) {
            System.out.println("Connected to database successfully!");

            // Check if migration V41 exists and failed
            String checkSql = "SELECT * FROM flyway_schema_history WHERE version = '41'";
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(checkSql)) {

                boolean hasFailedMigration = false;
                while (rs.next()) {
                    System.out.println("Migration V41 found - Success: " + rs.getBoolean("success"));
                    if (!rs.getBoolean("success")) {
                        hasFailedMigration = true;
                    }
                }

                if (hasFailedMigration) {
                    System.out.println("Removing failed migration V41...");
                    String deleteSql = "DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0";
                    int deletedRows = stmt.executeUpdate(deleteSql);
                    System.out.println("Deleted " + deletedRows + " failed migration entries");

                    if (deletedRows > 0) {
                        System.out.println("SUCCESS: Failed migration V41 has been repaired!");
                        System.out.println("You can now restart your Spring Boot application.");
                    }
                } else {
                    System.out.println("No failed migration V41 found.");
                }
            }

        } catch (SQLException e) {
            System.err.println("Database error: " + e.getMessage());
            System.err.println("Please ensure MySQL is running and credentials are correct.");
            System.err.println("URL: " + url);
            System.err.println("Username: " + username);
        }
    }
}