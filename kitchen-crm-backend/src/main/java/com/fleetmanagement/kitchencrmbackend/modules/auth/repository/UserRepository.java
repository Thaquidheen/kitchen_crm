package com.fleetmanagement.kitchencrmbackend.modules.auth.repository;

import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);

    @Query("SELECT u FROM User u JOIN FETCH u.roles WHERE u.email = :email")
    Optional<User> findByEmailWithRoles(@Param("email") String email);
}