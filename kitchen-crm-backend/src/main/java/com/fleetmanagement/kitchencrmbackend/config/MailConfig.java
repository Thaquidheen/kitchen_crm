package com.fleetmanagement.kitchencrmbackend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Mail configuration for Gmail SMTP
 */
@Configuration
@RequiredArgsConstructor
public class MailConfig {

    private final EmailProperties emailProperties;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        EmailProperties.SmtpConfig smtp = emailProperties.getSmtp();

        mailSender.setHost(smtp.getHost());
        mailSender.setPort(smtp.getPort());
        mailSender.setUsername(smtp.getUsername());
        mailSender.setPassword(smtp.getPassword());

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", String.valueOf(smtp.isAuth()));
        props.put("mail.smtp.starttls.enable", String.valueOf(smtp.isStarttls()));
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.trust", smtp.getHost());
        props.put("mail.debug", "true"); // enable SMTP debug for diagnostics

        return mailSender;
    }
}
