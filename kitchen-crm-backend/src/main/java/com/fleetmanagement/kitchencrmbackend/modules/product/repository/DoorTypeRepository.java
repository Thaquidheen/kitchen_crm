package com.fleetmanagement.kitchencrmbackend.modules.product.repository;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.DoorType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoorTypeRepository extends JpaRepository<DoorType, Long> {
    List<DoorType> findByActiveTrue();
    List<DoorType> findByBrandId(Long brandId);
    List<DoorType> findByMaterial(String material);

    @Query("SELECT d FROM DoorType d WHERE " +
            "(:name IS NULL OR LOWER(d.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
            "(:brandId IS NULL OR d.brand.id = :brandId) AND " +
            "(:material IS NULL OR LOWER(d.material) LIKE LOWER(CONCAT('%', :material, '%'))) AND " +
            "(:active IS NULL OR d.active = :active)")
    Page<DoorType> findByFilters(@Param("name") String name,
                                 @Param("brandId") Long brandId,
                                 @Param("material") String material,
                                 @Param("active") Boolean active,
                                 Pageable pageable);
}