package com.fleetmanagement.kitchencrmbackend.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import com.fleetmanagement.kitchencrmbackend.modules.audit.web.ActivityLogInterceptor;
import com.fleetmanagement.kitchencrmbackend.modules.finance.web.FinanceAccessInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Page;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;

@Configuration
public class WebConfig {

    /**
     * Write-action audit trail (Settings > Activity Log). Registered on /api/** so the
     * interceptor sees every controller; it self-filters to authenticated write methods.
     */
    @Bean
    public WebMvcConfigurer activityLogConfigurer(ActivityLogInterceptor interceptor) {
        return new WebMvcConfigurer() {
            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(interceptor).addPathPatterns("/api/**");
            }
        };
    }

    /**
     * Conceals the customer-finance API behind the reporting unlock key: without it those paths
     * answer 404, matching the UI, where the module is absent from the sidebar and its route
     * behaves like a mistyped one. The SUPER_ADMIN role checks on those endpoints are untouched —
     * this is a second lock, not a replacement.
     */
    @Bean
    public WebMvcConfigurer financeAccessConfigurer(FinanceAccessInterceptor interceptor) {
        return new WebMvcConfigurer() {
            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                // Both patterns on purpose: the list endpoint is the bare path, and relying on
                // "/**" to match zero segments would leave precisely the endpoint that enumerates
                // every customer's money wide open if that behaviour ever differed.
                registry.addInterceptor(interceptor)
                        .addPathPatterns("/api/v1/customer-finance", "/api/v1/customer-finance/**");
            }
        };
    }

    /**
     * Configure Jackson to properly serialize Page objects
     * This suppresses the warning about PageImpl serialization
     * Uses Spring Boot's recommended approach for customizing Jackson
     */
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jsonCustomizer() {
        return builder -> {
            SimpleModule module = new SimpleModule();
            module.addSerializer(new PageSerializer());
            // Ensure JavaTimeModule is registered for LocalDateTime serialization
            builder.modulesToInstall(JavaTimeModule.class);
            builder.modules(module);
        };
    }

    /**
     * Custom serializer for Page objects
     * Ensures stable JSON structure by only serializing necessary fields
     * Extends StdSerializer to properly define the handled type
     * Uses SerializerProvider to properly serialize nested objects with LocalDateTime
     */
    @SuppressWarnings("rawtypes")
    private static class PageSerializer extends StdSerializer<Page> {
        public PageSerializer() {
            super(Page.class);
        }

        @Override
        public void serialize(Page page, JsonGenerator gen, SerializerProvider serializers) throws IOException {
            gen.writeStartObject();
            // Use writeObjectField which delegates to SerializerProvider, ensuring LocalDateTime is properly serialized
            gen.writeObjectField("content", page.getContent());
            gen.writeNumberField("totalElements", page.getTotalElements());
            gen.writeNumberField("totalPages", page.getTotalPages());
            gen.writeNumberField("number", page.getNumber());
            gen.writeNumberField("size", page.getSize());
            gen.writeBooleanField("first", page.isFirst());
            gen.writeBooleanField("last", page.isLast());
            gen.writeNumberField("numberOfElements", page.getNumberOfElements());
            gen.writeEndObject();
        }
    }
}

