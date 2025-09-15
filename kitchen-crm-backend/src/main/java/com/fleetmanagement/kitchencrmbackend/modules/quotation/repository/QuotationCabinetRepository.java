package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationCabinet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationCabinetRepository extends JpaRepository<QuotationCabinet, Long> {
    List<QuotationCabinet> findByQuotationId(Long quotationId);
    void deleteByQuotationId(Long quotationId);
}