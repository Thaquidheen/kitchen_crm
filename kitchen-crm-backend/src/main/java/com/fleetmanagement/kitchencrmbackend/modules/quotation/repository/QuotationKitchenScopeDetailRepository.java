package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationKitchenScopeDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationKitchenScopeDetailRepository extends JpaRepository<QuotationKitchenScopeDetail, Long> {
    List<QuotationKitchenScopeDetail> findByKitchenIdOrderByFieldOrderAsc(Long kitchenId);
    void deleteByKitchenId(Long kitchenId);
}


