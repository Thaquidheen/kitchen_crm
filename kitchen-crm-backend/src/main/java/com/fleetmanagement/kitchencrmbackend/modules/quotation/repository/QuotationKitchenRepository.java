package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationKitchen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationKitchenRepository extends JpaRepository<QuotationKitchen, Long> {
    List<QuotationKitchen> findByQuotationIdOrderByKitchenOrderAsc(Long quotationId);
    void deleteByQuotationId(Long quotationId);
}


