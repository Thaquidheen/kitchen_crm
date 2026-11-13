package com.fleetmanagement.kitchencrmbackend.modules.permission.repository;

import com.fleetmanagement.kitchencrmbackend.modules.permission.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, Long> {

    List<UserPermission> findByUserId(Long userId);
}
