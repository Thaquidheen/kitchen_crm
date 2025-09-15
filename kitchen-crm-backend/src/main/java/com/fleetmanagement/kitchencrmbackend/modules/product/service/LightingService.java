package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.*;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;

import java.util.List;

public interface LightingService {
    // Light Profile methods
    ApiResponse<List<LightProfileDto>> getAllLightProfiles();
    ApiResponse<List<LightProfileDto>> getActiveLightProfiles();
    ApiResponse<LightProfileDto> getLightProfileById(Long id);
    ApiResponse<LightProfileDto> createLightProfile(LightProfileDto lightProfileDto);
    ApiResponse<LightProfileDto> updateLightProfile(Long id, LightProfileDto lightProfileDto);
    ApiResponse<String> deleteLightProfile(Long id);

    // Driver methods
    ApiResponse<List<DriverDto>> getAllDrivers();
    ApiResponse<List<DriverDto>> getActiveDrivers();
    ApiResponse<DriverDto> getDriverById(Long id);
    ApiResponse<DriverDto> createDriver(DriverDto driverDto);
    ApiResponse<DriverDto> updateDriver(Long id, DriverDto driverDto);
    ApiResponse<String> deleteDriver(Long id);

    // Connector methods
    ApiResponse<List<ConnectorDto>> getAllConnectors();
    ApiResponse<List<ConnectorDto>> getActiveConnectors();
    ApiResponse<ConnectorDto> getConnectorById(Long id);
    ApiResponse<ConnectorDto> createConnector(ConnectorDto connectorDto);
    ApiResponse<ConnectorDto> updateConnector(Long id, ConnectorDto connectorDto);
    ApiResponse<String> deleteConnector(Long id);

    // Sensor methods
    ApiResponse<List<SensorDto>> getAllSensors();
    ApiResponse<List<SensorDto>> getActiveSensors();
    ApiResponse<SensorDto> getSensorById(Long id);
    ApiResponse<SensorDto> createSensor(SensorDto sensorDto);
    ApiResponse<SensorDto> updateSensor(Long id, SensorDto sensorDto);
    ApiResponse<String> deleteSensor(Long id);
}