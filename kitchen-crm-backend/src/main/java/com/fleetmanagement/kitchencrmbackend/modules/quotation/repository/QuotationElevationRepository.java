package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationElevation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationElevationRepository extends JpaRepository<QuotationElevation, Long> {
    List<QuotationElevation> findByKitchenIdOrderByDisplayOrderAsc(Long kitchenId);
    void deleteByKitchenId(Long kitchenId);
}
