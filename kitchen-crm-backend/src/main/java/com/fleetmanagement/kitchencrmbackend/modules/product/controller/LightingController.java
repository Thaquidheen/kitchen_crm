package com.fleetmanagement.kitchencrmbackend.modules.product.controller;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.product.service.LightingService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lighting")
@CrossOrigin(origins = "*", maxAge = 3600)
public class LightingController {

    @Autowired
    private LightingService lightingService;

    // Light Profile endpoints
    @GetMapping("/profiles")
    public ResponseEntity<ApiResponse<List<LightProfileDto>>> getAllLightProfiles() {
        return ResponseEntity.ok(lightingService.getAllLightProfiles());
    }

    @GetMapping("/profiles/active")
    public ResponseEntity<ApiResponse<List<LightProfileDto>>> getActiveLightProfiles() {
        return ResponseEntity.ok(lightingService.getActiveLightProfiles());
    }

    @GetMapping("/profiles/{id}")
    public ResponseEntity<ApiResponse<LightProfileDto>> getLightProfileById(@PathVariable Long id) {
        ApiResponse<LightProfileDto> response = lightingService.getLightProfileById(id);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.notFound().build();
    }

    @PostMapping("/profiles")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<LightProfileDto>> createLightProfile(@Valid @RequestBody LightProfileDto lightProfileDto) {
        ApiResponse<LightProfileDto> response = lightingService.createLightProfile(lightProfileDto);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @PutMapping("/profiles/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<LightProfileDto>> updateLightProfile(@PathVariable Long id,
                                                                           @Valid @RequestBody LightProfileDto lightProfileDto) {
        ApiResponse<LightProfileDto> response = lightingService.updateLightProfile(id, lightProfileDto);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @DeleteMapping("/profiles/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteLightProfile(@PathVariable Long id) {
        return ResponseEntity.ok(lightingService.deleteLightProfile(id));
    }

    // Driver endpoints
    @GetMapping("/drivers")
    public ResponseEntity<ApiResponse<List<DriverDto>>> getAllDrivers() {
        return ResponseEntity.ok(lightingService.getAllDrivers());
    }

    @GetMapping("/drivers/active")
    public ResponseEntity<ApiResponse<List<DriverDto>>> getActiveDrivers() {
        return ResponseEntity.ok(lightingService.getActiveDrivers());
    }

    @GetMapping("/drivers/{id}")
    public ResponseEntity<ApiResponse<DriverDto>> getDriverById(@PathVariable Long id) {
        ApiResponse<DriverDto> response = lightingService.getDriverById(id);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.notFound().build();
    }

    @PostMapping("/drivers")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DriverDto>> createDriver(@Valid @RequestBody DriverDto driverDto) {
        ApiResponse<DriverDto> response = lightingService.createDriver(driverDto);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @PutMapping("/drivers/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DriverDto>> updateDriver(@PathVariable Long id,
                                                               @Valid @RequestBody DriverDto driverDto) {
        ApiResponse<DriverDto> response = lightingService.updateDriver(id, driverDto);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @DeleteMapping("/drivers/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteDriver(@PathVariable Long id) {
        return ResponseEntity.ok(lightingService.deleteDriver(id));
    }

    // Connector endpoints
    @GetMapping("/connectors")
    public ResponseEntity<ApiResponse<List<ConnectorDto>>> getAllConnectors() {
        return ResponseEntity.ok(lightingService.getAllConnectors());
    }

    @GetMapping("/connectors/active")
    public ResponseEntity<ApiResponse<List<ConnectorDto>>> getActiveConnectors() {
        return ResponseEntity.ok(lightingService.getActiveConnectors());
    }

    @GetMapping("/connectors/{id}")
    public ResponseEntity<ApiResponse<ConnectorDto>> getConnectorById(@PathVariable Long id) {
        ApiResponse<ConnectorDto> response = lightingService.getConnectorById(id);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.notFound().build();
    }

    @PostMapping("/connectors")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ConnectorDto>> createConnector(@Valid @RequestBody ConnectorDto connectorDto) {
        ApiResponse<ConnectorDto> response = lightingService.createConnector(connectorDto);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @PutMapping("/connectors/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ConnectorDto>> updateConnector(@PathVariable Long id,
                                                                     @Valid @RequestBody ConnectorDto connectorDto) {
        ApiResponse<ConnectorDto> response = lightingService.updateConnector(id, connectorDto);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @DeleteMapping("/connectors/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteConnector(@PathVariable Long id) {
        return ResponseEntity.ok(lightingService.deleteConnector(id));
    }

    // Sensor endpoints
    @GetMapping("/sensors")
    public ResponseEntity<ApiResponse<List<SensorDto>>> getAllSensors() {
        return ResponseEntity.ok(lightingService.getAllSensors());
    }

    @GetMapping("/sensors/active")
    public ResponseEntity<ApiResponse<List<SensorDto>>> getActiveSensors() {
        return ResponseEntity.ok(lightingService.getActiveSensors());
    }

    @GetMapping("/sensors/{id}")
    public ResponseEntity<ApiResponse<SensorDto>> getSensorById(@PathVariable Long id) {
        ApiResponse<SensorDto> response = lightingService.getSensorById(id);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.notFound().build();
    }

    @PostMapping("/sensors")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SensorDto>> createSensor(@Valid @RequestBody SensorDto sensorDto) {
        ApiResponse<SensorDto> response = lightingService.createSensor(sensorDto);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @PutMapping("/sensors/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SensorDto>> updateSensor(@PathVariable Long id,
                                                               @Valid @RequestBody SensorDto sensorDto) {
        ApiResponse<SensorDto> response = lightingService.updateSensor(id, sensorDto);
        return response.getSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @DeleteMapping("/sensors/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteSensor(@PathVariable Long id) {
        return ResponseEntity.ok(lightingService.deleteSensor(id));
    }
}