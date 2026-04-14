package com.fleetmanagement.kitchencrmbackend.modules.product.repository;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.InnerPanelType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InnerPanelTypeRepository extends JpaRepository<InnerPanelType, Long> {
    List<InnerPanelType> findByActiveTrue();
    boolean existsByName(String name);
}
