package com.fleetmanagement.kitchencrmbackend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Configuration properties for signature service
 */
@Configuration
@ConfigurationProperties(prefix = "app.signature")
@Data
public class SignatureProperties {

    private String baseUrl = "http://localhost:3000";
    private int tokenExpiryDays = 7;
    private List<Integer> reminderDays = List.of(3, 6);
    private boolean enableReminders = true;
}
