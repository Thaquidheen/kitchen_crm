package com.fleetmanagement.kitchencrmbackend.modules.quotation.margincode;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarginCodeRepository extends JpaRepository<MarginCode, Long> {

    List<MarginCode> findAllByOrderByPercentageAsc();

    List<MarginCode> findAllByOrderByCodeAsc();
}
