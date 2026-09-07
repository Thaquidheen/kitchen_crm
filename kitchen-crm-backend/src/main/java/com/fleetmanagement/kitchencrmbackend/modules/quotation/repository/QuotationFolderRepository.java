package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
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
            " OR LOWER(f.name) LIKE LOWER(CONCAT('%', :customerName, '%'))) AND " +
            // Filter by the folder's LATEST version status: a folder matches when its highest
            // version_number quotation has the requested status. Null status = no status filter.
            "(:status IS NULL OR EXISTS (" +
            "   SELECT q FROM Quotation q WHERE q.folder = f AND q.status = :status AND " +
            "   q.versionNumber = (SELECT MAX(q2.versionNumber) FROM Quotation q2 WHERE q2.folder = f)))")
    Page<QuotationFolder> findByFilters(@Param("customerName") String customerName,
                                        @Param("status") Quotation.QuotationStatus status,
                                        Pageable pageable);
}
