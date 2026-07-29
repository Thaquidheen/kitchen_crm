package com.fleetmanagement.kitchencrmbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling powers the reminder due-checker (and the pre-existing refresh-token
// cleanup cron, which never actually ran before this was added).
@SpringBootApplication
@EnableScheduling
@EntityScan(basePackages = "com.fleetmanagement.kitchencrmbackend")
@EnableJpaRepositories(basePackages = "com.fleetmanagement.kitchencrmbackend")
public class KitchenCrmBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(KitchenCrmBackendApplication.class, args);
    }

}
