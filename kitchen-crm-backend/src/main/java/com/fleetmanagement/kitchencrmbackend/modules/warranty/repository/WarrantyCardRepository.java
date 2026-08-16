package com.fleetmanagement.kitchencrmbackend.modules.warranty.repository;

import com.fleetmanagement.kitchencrmbackend.modules.warranty.entity.WarrantyCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WarrantyCardRepository extends JpaRepository<WarrantyCard, Long> {
    
    Optional<WarrantyCard> findByCustomerId(Long customerId);
    
    Optional<WarrantyCard> findByCertificateNumber(String certificateNumber);
    
    boolean existsByCustomerId(Long customerId);

    // unlinkFromProject removed with the Projects module — see the note in QuotationRepository.
}


