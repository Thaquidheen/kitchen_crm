package com.fleetmanagement.kitchencrmbackend.modules.settings.repository;

import com.fleetmanagement.kitchencrmbackend.modules.settings.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {
    
    /**
     * Find a system setting by its key
     * @param settingKey the unique key for the setting
     * @return Optional containing the setting if found
     */
    Optional<SystemSetting> findBySettingKey(String settingKey);
}


