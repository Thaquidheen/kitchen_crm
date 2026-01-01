package com.fleetmanagement.kitchencrmbackend.modules.vendor.repository;

import com.fleetmanagement.kitchencrmbackend.modules.vendor.entity.Vendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {

    /**
     * Find all active vendors
     */
    List<Vendor> findByActiveTrue();

    /**
     * Find vendors by type
     */
    List<Vendor> findByVendorType(Vendor.VendorType vendorType);

    /**
     * Search vendors by name (case-insensitive, partial match)
     */
    Page<Vendor> findByVendorNameContainingIgnoreCase(String name, Pageable pageable);

    /**
     * Find active vendors by type
     */
    List<Vendor> findByActiveTrueAndVendorType(Vendor.VendorType vendorType);

    /**
     * Search active vendors by name
     */
    Page<Vendor> findByActiveTrueAndVendorNameContainingIgnoreCase(String name, Pageable pageable);
}
