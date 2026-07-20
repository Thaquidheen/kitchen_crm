package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationFolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuotationFolderRepository extends JpaRepository<QuotationFolder, Long> {

    @Query("SELECT f FROM QuotationFolder f WHERE " +
            "(:customerName IS NULL OR LOWER(f.customer.name) LIKE LOWER(CONCAT('%', :customerName, '%')) " +
            " OR LOWER(f.name) LIKE LOWER(CONCAT('%', :customerName, '%')))")
    Page<QuotationFolder> findByFilters(@Param("customerName") String customerName, Pageable pageable);
}
