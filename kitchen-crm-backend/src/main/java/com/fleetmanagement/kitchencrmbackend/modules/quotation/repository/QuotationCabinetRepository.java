package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationCabinet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationCabinetRepository extends JpaRepository<QuotationCabinet, Long> {

    @Query("SELECT qc FROM QuotationCabinet qc " +
           "LEFT JOIN FETCH qc.cabinetType " +
           "LEFT JOIN FETCH qc.linkedDoorType " +
           "WHERE qc.quotation.id = :quotationId")
    List<QuotationCabinet> findByQuotationId(@Param("quotationId") Long quotationId);

    @Query("SELECT qc FROM QuotationCabinet qc " +
           "LEFT JOIN FETCH qc.cabinetType " +
           "LEFT JOIN FETCH qc.linkedDoorType " +
           "WHERE qc.kitchen.id = :kitchenId")
    List<QuotationCabinet> findByKitchenId(@Param("kitchenId") Long kitchenId);

    void deleteByQuotationId(Long quotationId);
}