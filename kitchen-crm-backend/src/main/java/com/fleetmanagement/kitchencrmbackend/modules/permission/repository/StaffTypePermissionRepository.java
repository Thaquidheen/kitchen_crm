package com.fleetmanagement.kitchencrmbackend.modules.permission.repository;

import com.fleetmanagement.kitchencrmbackend.modules.permission.entity.StaffTypePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffTypePermissionRepository extends JpaRepository<StaffTypePermission, Long> {

    List<StaffTypePermission> findByStaffType(String staffType);
}
