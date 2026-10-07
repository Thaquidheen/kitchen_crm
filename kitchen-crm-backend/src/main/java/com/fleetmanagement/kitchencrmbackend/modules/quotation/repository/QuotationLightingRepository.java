package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationLighting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface QuotationLightingRepository extends JpaRepository<QuotationLighting, Long> {
    List<QuotationLighting> findByQuotationId(Long quotationId);
    List<QuotationLighting> findByKitchenId(Long kitchenId);
    void deleteByQuotationId(Long quotationId);

    /**
     * What each lighting line of a quotation costs, read as plain values. The lines themselves
     * are not loaded: a save reads this just before it deletes and rebuilds every line.
     */
    @Query("SELECT k.kitchenName AS kitchenName, k.kitchenOrder AS kitchenOrder, " +
           "l.itemType AS itemType, l.itemId AS itemId, l.unitPrice AS unitPrice " +
           "FROM QuotationLighting l LEFT JOIN l.kitchen k " +
           "WHERE l.quotation.id = :quotationId ORDER BY l.id")
    List<StoredRate> findStoredRatesByQuotationId(@Param("quotationId") Long quotationId);

    interface StoredRate {
        String getKitchenName();
        Integer getKitchenOrder();
        QuotationLighting.LightingItemType getItemType();
        Long getItemId();
        BigDecimal getUnitPrice();
    }
}