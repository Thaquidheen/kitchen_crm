package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationKitchenPlanImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationKitchenPlanImageRepository extends JpaRepository<QuotationKitchenPlanImage, Long> {
    @Query("SELECT pi FROM QuotationKitchenPlanImage pi " +
           "LEFT JOIN FETCH pi.customerPlanImage " +
           "LEFT JOIN FETCH pi.designPhaseFile " +
           "WHERE pi.kitchen.id = :kitchenId " +
           "ORDER BY pi.imageOrder ASC")
    List<QuotationKitchenPlanImage> findByKitchenIdOrderByImageOrderAsc(@Param("kitchenId") Long kitchenId);
    
    void deleteByKitchenId(Long kitchenId);
}

