package com.fleetmanagement.kitchencrmbackend.modules.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Service for loading and processing email HTML templates
 */
@Service
@Slf4j
public class EmailTemplateService {

    private static final String TEMPLATE_BASE_PATH = "templates/email/";

    /**
     * Load email template from resources folder
     *
     * @param templateName name of the template file (without .html extension)
     * @return template content as string
     */
    public String loadTemplate(String templateName) {
        try {
            String templatePath = TEMPLATE_BASE_PATH + templateName + ".html";
            ClassPathResource resource = new ClassPathResource(templatePath);

            if (!resource.exists()) {
                log.error("Email template not found: {}", templatePath);
                return getDefaultTemplate();
            }

            return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);

        } catch (IOException e) {
            log.error("Error loading email template: {}", templateName, e);
            return getDefaultTemplate();
        }
    }

    /**
     * Replace variables in template with actual values
     *
     * @param template template content with {{variable}} placeholders
     * @param variables map of variable names to values
     * @return processed template with replaced variables
     */
    public String replaceVariables(String template, Map<String, String> variables) {
        if (template == null || variables == null || variables.isEmpty()) {
            return template;
        }

        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue() : "";
            result = result.replace(placeholder, value);
        }

        return result;
    }

    /**
     * Build complete email HTML with template and variables
     *
     * @param templateName name of the template
     * @param variables variables to replace
     * @return complete HTML email content
     */
    public String buildEmailContent(String templateName, Map<String, String> variables) {
        String template = loadTemplate(templateName);
        return replaceVariables(template, variables);
    }

    /**
     * Default template if specific template is not found
     */
    private String getDefaultTemplate() {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>HOCH</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px;">
                        <h2 style="color: #2c3e50; margin-bottom: 20px;">{{title}}</h2>
                        <div style="background-color: white; padding: 20px; border-radius: 5px;">
                            {{content}}
                        </div>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; text-align: center;">
                            <p>HOCH - Kitchen Management System</p>
                            <p>This is an automated email. Please do not reply to this message.</p>
                        </div>
                    </div>
                </body>
                </html>
                """;
    }

    /**
     * Wrap content in base email layout
     */
    public String wrapInBaseLayout(String content, String title) {
        String template = getDefaultTemplate();
        return template
                .replace("{{title}}", title)
                .replace("{{content}}", content);
    }
}
