package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationLighting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationLightingRepository extends JpaRepository<QuotationLighting, Long> {
    List<QuotationLighting> findByQuotationId(Long quotationId);
    void deleteByQuotationId(Long quotationId);
}