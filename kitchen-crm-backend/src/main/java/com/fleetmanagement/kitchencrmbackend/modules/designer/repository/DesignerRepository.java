package com.fleetmanagement.kitchencrmbackend.modules.designer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.designer.entity.Designer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DesignerRepository extends JpaRepository<Designer, Long> {
    
    Optional<Designer> findByEmail(String email);
    
    Boolean existsByEmail(String email);
    
    List<Designer> findByActiveTrue();
    
    List<Designer> findByDepartment(String department);
    
    @Query("SELECT d FROM Designer d WHERE d.active = true AND d.maxConcurrentProjects > 0")
    List<Designer> findAvailableDesigners();
    
    @Query("SELECT d FROM Designer d WHERE d.name LIKE %:name% OR d.email LIKE %:name%")
    List<Designer> findByNameContainingIgnoreCase(@Param("name") String name);
    
    @Query("SELECT COUNT(d) FROM Designer d WHERE d.active = true")
    Long countActiveDesigners();
    
    @Query("SELECT d FROM Designer d WHERE d.specialization LIKE %:specialization%")
    List<Designer> findBySpecializationContaining(@Param("specialization") String specialization);
}
