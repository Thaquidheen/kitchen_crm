package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationAccessory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationAccessoryRepository extends JpaRepository<QuotationAccessory, Long> {
    List<QuotationAccessory> findByQuotationId(Long quotationId);
    void deleteByQuotationId(Long quotationId);
}