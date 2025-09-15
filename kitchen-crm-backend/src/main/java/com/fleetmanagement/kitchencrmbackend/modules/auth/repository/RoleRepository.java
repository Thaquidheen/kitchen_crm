package com.fleetmanagement.kitchencrmbackend.modules.auth.repository;

import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(Role.RoleName roleName);
}