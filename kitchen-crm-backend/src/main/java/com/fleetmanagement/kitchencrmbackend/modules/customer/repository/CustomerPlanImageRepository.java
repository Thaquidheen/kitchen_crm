package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerPlanImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerPlanImageRepository extends JpaRepository<CustomerPlanImage, Long> {
    List<CustomerPlanImage> findByCustomerIdAndImageType(Long customerId, CustomerPlanImage.ImageType imageType);
    List<CustomerPlanImage> findByCustomerId(Long customerId);

    void deleteByCustomerId(Long customerId);
}