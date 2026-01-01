package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationAccessory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationAccessoryRepository extends JpaRepository<QuotationAccessory, Long> {

    @Query("SELECT qa FROM QuotationAccessory qa " +
           "LEFT JOIN FETCH qa.accessory a " +
           "LEFT JOIN FETCH a.brand " +
           "LEFT JOIN FETCH a.category " +
           "WHERE qa.quotation.id = :quotationId")
    List<QuotationAccessory> findByQuotationId(@Param("quotationId") Long quotationId);

    @Query("SELECT qa FROM QuotationAccessory qa " +
           "LEFT JOIN FETCH qa.accessory a " +
           "LEFT JOIN FETCH a.brand " +
           "LEFT JOIN FETCH a.category " +
           "WHERE qa.kitchen.id = :kitchenId")
    List<QuotationAccessory> findByKitchenId(@Param("kitchenId") Long kitchenId);

    void deleteByQuotationId(Long quotationId);
}