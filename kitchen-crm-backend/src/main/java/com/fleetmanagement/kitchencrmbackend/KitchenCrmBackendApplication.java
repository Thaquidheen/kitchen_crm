package com.fleetmanagement.kitchencrmbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.fleetmanagement.kitchencrmbackend")
@EnableJpaRepositories(basePackages = "com.fleetmanagement.kitchencrmbackend")
public class KitchenCrmBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(KitchenCrmBackendApplication.class, args);
    }

}
