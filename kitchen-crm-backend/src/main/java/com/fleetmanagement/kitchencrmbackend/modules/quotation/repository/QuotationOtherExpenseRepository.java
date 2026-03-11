package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationOtherExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationOtherExpenseRepository extends JpaRepository<QuotationOtherExpense, Long> {

    List<QuotationOtherExpense> findByQuotationId(Long quotationId);

    List<QuotationOtherExpense> findByQuotationIdAndKitchenIsNull(Long quotationId);

    List<QuotationOtherExpense> findByKitchenId(@Param("kitchenId") Long kitchenId);

    void deleteByQuotationId(Long quotationId);
}
