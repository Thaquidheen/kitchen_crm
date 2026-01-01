package com.fleetmanagement.kitchencrmbackend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for email service
 * Uses Gmail SMTP only
 */
@Configuration
@ConfigurationProperties(prefix = "app.email")
@Data
public class EmailProperties {

    private SmtpConfig smtp = new SmtpConfig();
    private boolean enabled = true;
    private int retryAttempts = 3;
    private long retryDelayMs = 2000;

    @Data
    public static class SmtpConfig {
        private String host = "smtp.gmail.com";
        private int port = 587;
        private String username;
        private String password;
        private String fromEmail;
        private String fromName;
        private boolean auth = true;
        private boolean starttls = true;
    }
}
