package com.fleetmanagement.kitchencrmbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.util.unit.DataSize;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;
import org.springframework.web.util.UriUtils;
import org.springframework.lang.NonNull;

import jakarta.servlet.MultipartConfigElement;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;

@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir:uploads/plan-images}")
    private String planImagesUploadDir;

    @Value("${app.design-upload-dir:uploads/design-files}")
    private String designFilesUploadDir;

    @Value("${app.accessory-upload-dir:uploads/accessory-images}")
    private String accessoryImagesUploadDir;

    @Value("${app.appliance-quotation-upload-dir:uploads/appliance-quotations}")
    private String applianceQuotationsUploadDir;

    @Value("${file.upload-dir:./uploads}")
    private String baseUploadDir;

    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();

        // Set maximum file size (50MB)
        factory.setMaxFileSize(DataSize.ofMegabytes(50));

        // One upload may carry several files (a design as PDF + images + a CAD drawing): up to
        // 200 MB of files, plus room for the form's own wrapping. nginx allows 220M.
        factory.setMaxRequestSize(DataSize.ofMegabytes(210));

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

        // Make appliance quotation PDFs accessible via URL
        registry.addResourceHandler("/uploads/appliance-quotations/**")
                .addResourceLocations("file:" + Paths.get(applianceQuotationsUploadDir).toAbsolutePath().toString() + "/");

        // Finance receipts deliberately have no handler here any more: they are read only through
        // /api/v1/customer-finance/receipts/{id}/file, behind the role check and the reporting key.

        // Make root uploads folder accessible via URL (for background images, etc.). The receipts
        // and warranty certificate folders sit inside this root, so this handler would still serve
        // them; the resolver below refuses them. SecurityConfig and nginx refuse those paths as
        // well; this is the last of the three locks. Unlike the SecurityConfig matcher it ignores
        // letter case, which matters on a case-insensitive disk (a Windows dev machine would
        // otherwise open /uploads/Finance-Receipts/...).
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + Paths.get(baseUploadDir).toAbsolutePath().toString() + "/")
                .resourceChain(false)
                .addResolver(new PublicUploadsResolver());
    }

    /**
     * Upload folders whose files are never public: finance receipts (money paperwork, predictable
     * names) and warranty certificate PDFs (named by customer id and certificate number). Screens
     * read them through authenticated API endpoints only.
     */
    static final Set<String> PRIVATE_UPLOAD_FOLDERS = Set.of("finance-receipts", "warranty-cards");

    /** The ordinary file lookup, except that it finds nothing inside a private folder. */
    private static class PublicUploadsResolver extends PathResourceResolver {
        @Override
        protected Resource getResource(String resourcePath, Resource location) throws IOException {
            return isInPrivateFolder(resourcePath) ? null : super.getResource(resourcePath, location);
        }
    }

    /**
     * Whether a path under /uploads/ starts in one of the private folders. Decoded and lower-cased
     * first, empty or "." segments skipped and trailing dots and spaces dropped (Windows ignores
     * them), so a different spelling of the folder name does not slip past. nginx refuses these
     * folders too. A path that cannot be decoded is treated as private: refusing it costs nothing.
     */
    static boolean isInPrivateFolder(String resourcePath) {
        String path;
        try {
            path = UriUtils.decode(resourcePath, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return true;
        }
        for (String segment : path.replace('\\', '/').toLowerCase(Locale.ROOT).split("/")) {
            if (segment.isEmpty() || segment.equals(".")) {
                continue;
            }
            return PRIVATE_UPLOAD_FOLDERS.contains(segment.replaceAll("[. ]+$", ""));
        }
        return false;
    }
}