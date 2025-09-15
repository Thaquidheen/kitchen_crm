package com.fleetmanagement.kitchencrmbackend.modules.product.repository;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.CabinetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CabinetTypeRepository extends JpaRepository<CabinetType, Long> {
    List<CabinetType> findByActiveTrue();
    List<CabinetType> findByCategoryId(Long categoryId);
    List<CabinetType> findByBrandId(Long brandId);
    List<CabinetType> findByMaterialId(Long materialId);

    @Query("SELECT c FROM CabinetType c WHERE " +
            "(:name IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
            "(:categoryId IS NULL OR c.category.id = :categoryId) AND " +
            "(:brandId IS NULL OR c.brand.id = :brandId) AND " +
            "(:materialId IS NULL OR c.material.id = :materialId) AND " +
            "(:active IS NULL OR c.active = :active)")
    Page<CabinetType> findByFilters(@Param("name") String name,
                                    @Param("categoryId") Long categoryId,
                                    @Param("brandId") Long brandId,
                                    @Param("materialId") Long materialId,
                                    @Param("active") Boolean active,
                                    Pageable pageable);
}