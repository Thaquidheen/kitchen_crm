import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Debug utility to check what password matches the stored hash
 */
public class DebugPasswordHash {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // The hash from the database
        String storedHash = "$2a$10$SlXF3x8.j1aSjtKYf2ZxZu1LrqGDk2qXlFGR2k0K9V4kf5SomTuiy";
        
        // Common passwords to test
        String[] testPasswords = {
            "admin123",
            "admin",
            "password",
            "123456",
            "password123",
            "admin@123",
            "superadmin",
            "root",
            ""
        };
        
        System.out.println("Testing stored hash: " + storedHash);
        System.out.println("==========================================\n");
        
        for (String testPassword : testPasswords) {
            try {
                boolean matches = encoder.matches(testPassword, storedHash);
                System.out.printf("Testing: '%s' - %s\n", testPassword, matches ? "✅ MATCHES!" : "❌ No match");
                
                if (matches) {
                    System.out.println("\n🎉 FOUND THE PASSWORD: " + testPassword);
                    break;
                }
            } catch (Exception e) {
                System.out.printf("Testing: '%s' - Error: %s\n", testPassword, e.getMessage());
            }
        }
        
        // Also try to generate the hash for admin123 and staff123
        System.out.println("\n==========================================");
        System.out.println("Generating hashes for common passwords:");
        System.out.println("==========================================");
        
        String[] passwordsToGenerate = {"admin123", "staff123", "admin", "password123"};
        
        for (String pwd : passwordsToGenerate) {
            String generatedHash = encoder.encode(pwd);
            System.out.printf("\nPassword: '%s'\nHash: %s\n", pwd, generatedHash);
        }
    }
}


