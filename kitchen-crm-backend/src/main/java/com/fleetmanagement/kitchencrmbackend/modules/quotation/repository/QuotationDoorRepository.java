package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationDoor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationDoorRepository extends JpaRepository<QuotationDoor, Long> {

    @Query("SELECT qd FROM QuotationDoor qd " +
           "LEFT JOIN FETCH qd.doorType " +
           "WHERE qd.quotation.id = :quotationId")
    List<QuotationDoor> findByQuotationId(@Param("quotationId") Long quotationId);

    @Query("SELECT qd FROM QuotationDoor qd " +
           "LEFT JOIN FETCH qd.doorType " +
           "WHERE qd.kitchen.id = :kitchenId")
    List<QuotationDoor> findByKitchenId(@Param("kitchenId") Long kitchenId);

    void deleteByQuotationId(Long quotationId);
}