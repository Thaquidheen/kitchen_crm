package com.fleetmanagement.kitchencrmbackend.modules.product.repository;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Connector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConnectorRepository extends JpaRepository<Connector, Long> {
    List<Connector> findByActiveTrue();
    List<Connector> findByType(Connector.ConnectorType type);
}