package com.fleetmanagement.kitchencrmbackend.modules.notification.repository;

import com.fleetmanagement.kitchencrmbackend.modules.notification.entity.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for NotificationTemplate entity
 * Handles database operations for notification templates
 */
@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, Long> {

    /**
     * Find template by unique template code
     */
    Optional<NotificationTemplate> findByTemplateCode(String templateCode);

    /**
     * Find active template by template code
     */
    Optional<NotificationTemplate> findByTemplateCodeAndIsActiveTrue(String templateCode);

    /**
     * Find all active templates
     */
    List<NotificationTemplate> findByIsActiveTrueOrderByTemplateName();

    /**
     * Find all inactive templates
     */
    List<NotificationTemplate> findByIsActiveFalseOrderByTemplateName();

    /**
     * Find templates by category
     */
    List<NotificationTemplate> findByCategoryOrderByTemplateName(String category);

    /**
     * Find active templates by category
     */
    @Query("SELECT nt FROM NotificationTemplate nt " +
           "WHERE nt.category = :category " +
           "AND nt.isActive = true " +
           "ORDER BY nt.templateName")
    List<NotificationTemplate> findActiveByCategoryOrderByTemplateName(@Param("category") String category);

    /**
     * Find templates by language code
     */
    List<NotificationTemplate> findByLanguageCodeOrderByTemplateName(String languageCode);

    /**
     * Find active templates by language code
     */
    @Query("SELECT nt FROM NotificationTemplate nt " +
           "WHERE nt.languageCode = :languageCode " +
           "AND nt.isActive = true " +
           "ORDER BY nt.templateName")
    List<NotificationTemplate> findActiveByLanguageCodeOrderByTemplateName(@Param("languageCode") String languageCode);

    /**
     * Find template by code and language
     */
    @Query("SELECT nt FROM NotificationTemplate nt " +
           "WHERE nt.templateCode = :templateCode " +
           "AND nt.languageCode = :languageCode " +
           "AND nt.isActive = true")
    Optional<NotificationTemplate> findActiveByCodeAndLanguage(
        @Param("templateCode") String templateCode,
        @Param("languageCode") String languageCode
    );

    /**
     * Find templates that have both email and WhatsApp content
     */
    @Query("SELECT nt FROM NotificationTemplate nt " +
           "WHERE nt.emailSubject IS NOT NULL " +
           "AND nt.emailBody IS NOT NULL " +
           "AND nt.whatsappTemplateName IS NOT NULL " +
           "AND nt.whatsappMessage IS NOT NULL " +
           "AND nt.isActive = true " +
           "ORDER BY nt.templateName")
    List<NotificationTemplate> findDualChannelTemplates();

    /**
     * Find templates that only have email content
     */
    @Query("SELECT nt FROM NotificationTemplate nt " +
           "WHERE nt.emailSubject IS NOT NULL " +
           "AND nt.emailBody IS NOT NULL " +
           "AND (nt.whatsappTemplateName IS NULL OR nt.whatsappMessage IS NULL) " +
           "AND nt.isActive = true " +
           "ORDER BY nt.templateName")
    List<NotificationTemplate> findEmailOnlyTemplates();

    /**
     * Find templates that only have WhatsApp content
     */
    @Query("SELECT nt FROM NotificationTemplate nt " +
           "WHERE nt.whatsappTemplateName IS NOT NULL " +
           "AND nt.whatsappMessage IS NOT NULL " +
           "AND (nt.emailSubject IS NULL OR nt.emailBody IS NULL) " +
           "AND nt.isActive = true " +
           "ORDER BY nt.templateName")
    List<NotificationTemplate> findWhatsAppOnlyTemplates();

    /**
     * Find template by WhatsApp template name (for webhook matching)
     */
    Optional<NotificationTemplate> findByWhatsappTemplateName(String whatsappTemplateName);

    /**
     * Check if template code already exists
     */
    boolean existsByTemplateCode(String templateCode);

    /**
     * Count active templates by category
     */
    @Query("SELECT COUNT(nt) FROM NotificationTemplate nt " +
           "WHERE nt.category = :category " +
           "AND nt.isActive = true")
    Long countActiveByCategory(@Param("category") String category);

    /**
     * Get all categories
     */
    @Query("SELECT DISTINCT nt.category FROM NotificationTemplate nt " +
           "WHERE nt.category IS NOT NULL " +
           "ORDER BY nt.category")
    List<String> findAllCategories();

    /**
     * Get all language codes
     */
    @Query("SELECT DISTINCT nt.languageCode FROM NotificationTemplate nt " +
           "WHERE nt.languageCode IS NOT NULL " +
           "ORDER BY nt.languageCode")
    List<String> findAllLanguageCodes();

    /**
     * Find templates by version
     */
    List<NotificationTemplate> findByVersionOrderByTemplateName(Integer version);

    /**
     * Find latest version of a template
     */
    @Query("SELECT nt FROM NotificationTemplate nt " +
           "WHERE nt.templateCode = :templateCode " +
           "ORDER BY nt.version DESC")
    List<NotificationTemplate> findAllVersionsByCode(@Param("templateCode") String templateCode);

    /**
     * Search templates by name or description
     */
    @Query("SELECT nt FROM NotificationTemplate nt " +
           "WHERE (LOWER(nt.templateName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "   OR LOWER(nt.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "   OR LOWER(nt.templateCode) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND nt.isActive = true " +
           "ORDER BY nt.templateName")
    List<NotificationTemplate> searchTemplates(@Param("searchTerm") String searchTerm);
}
