package com.fleetmanagement.kitchencrmbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

import jakarta.servlet.MultipartConfigElement;
import java.nio.file.Paths;

@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir:uploads/plan-images}")
    private String planImagesUploadDir;

    @Value("${app.design-upload-dir:uploads/design-files}")
    private String designFilesUploadDir;

    @Value("${app.accessory-upload-dir:uploads/accessory-images}")
    private String accessoryImagesUploadDir;

    @Value("${file.upload-dir:./uploads}")
    private String baseUploadDir;

    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();

        // Set maximum file size (50MB)
        factory.setMaxFileSize(DataSize.ofMegabytes(50));

        // Set maximum request size (50MB)
        factory.setMaxRequestSize(DataSize.ofMegabytes(50));

        return factory.createMultipartConfig();
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Make plan images accessible via URL
        registry.addResourceHandler("/uploads/plan-images/**")
                .addResourceLocations("file:" + Paths.get(planImagesUploadDir).toAbsolutePath().toString() + "/");

        // Make design files accessible via URL
        registry.addResourceHandler("/uploads/design-files/**")
                .addResourceLocations("file:" + Paths.get(designFilesUploadDir).toAbsolutePath().toString() + "/");

        // Make accessory images accessible via URL
        registry.addResourceHandler("/uploads/accessory-images/**")
                .addResourceLocations("file:" + Paths.get(accessoryImagesUploadDir).toAbsolutePath().toString() + "/");

        // Make root uploads folder accessible via URL (for background images, etc.)
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + Paths.get(baseUploadDir).toAbsolutePath().toString() + "/");
    }
}