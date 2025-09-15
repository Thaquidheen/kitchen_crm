package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationDoor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationDoorRepository extends JpaRepository<QuotationDoor, Long> {
    List<QuotationDoor> findByQuotationId(Long quotationId);
    void deleteByQuotationId(Long quotationId);
}