package com.fleetmanagement.kitchencrmbackend.modules.appliance.repository;

import com.fleetmanagement.kitchencrmbackend.modules.appliance.entity.ApplianceCustomer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface ApplianceCustomerRepository extends JpaRepository<ApplianceCustomer, Long> {

    @Query("SELECT a FROM ApplianceCustomer a WHERE " +
            "(:category IS NULL OR a.category = :category) AND " +
            "(:status IS NULL OR a.status = :status) AND " +
            "(:search IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            " OR LOWER(a.contact) LIKE LOWER(CONCAT('%', :search, '%')) " +
            " OR LOWER(a.brand) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ApplianceCustomer> findByFilters(@Param("category") ApplianceCustomer.Category category,
                                          @Param("status") ApplianceCustomer.Status status,
                                          @Param("search") String search,
                                          Pageable pageable);

    Long countByCategory(ApplianceCustomer.Category category);

    @Query("SELECT COUNT(a) FROM ApplianceCustomer a WHERE " +
            "(:category IS NULL OR a.category = :category) AND a.status = :status")
    Long countByCategoryAndStatus(@Param("category") ApplianceCustomer.Category category,
                                  @Param("status") ApplianceCustomer.Status status);

    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM ApplianceCustomer a WHERE " +
            "(:category IS NULL OR a.category = :category)")
    BigDecimal getTotalAmount(@Param("category") ApplianceCustomer.Category category);
}
