package com.fleetmanagement.kitchencrmbackend.modules.product.repository;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Accessory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccessoryRepository extends JpaRepository<Accessory, Long> {
    Optional<Accessory> findByMaterialCode(String materialCode);
    List<Accessory> findByActiveTrue();
    List<Accessory> findByCategoryId(Long categoryId);
    List<Accessory> findByBrandId(Long brandId);
    Boolean existsByMaterialCode(String materialCode);

    @Query("SELECT a FROM Accessory a WHERE " +
            "(:name IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
            "(:categoryId IS NULL OR a.category.id = :categoryId) AND " +
            "(:brandId IS NULL OR a.brand.id = :brandId) AND " +
            "(:active IS NULL OR a.active = :active)")
    Page<Accessory> findByFilters(@Param("name") String name,
                                  @Param("categoryId") Long categoryId,
                                  @Param("brandId") Long brandId,
                                  @Param("active") Boolean active,
                                  Pageable pageable);
}