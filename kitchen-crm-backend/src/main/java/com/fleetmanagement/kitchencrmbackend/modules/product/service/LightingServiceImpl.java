package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.*;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.*;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LightingServiceImpl implements LightingService {

    @Autowired
    private LightProfileRepository lightProfileRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private ConnectorRepository connectorRepository;

    @Autowired
    private SensorRepository sensorRepository;

    // Light Profile implementations
    @Override
    public ApiResponse<List<LightProfileDto>> getAllLightProfiles() {
        List<LightProfile> lightProfiles = lightProfileRepository.findAll();
        List<LightProfileDto> dtos = lightProfiles.stream()
                .map(this::convertLightProfileToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<List<LightProfileDto>> getActiveLightProfiles() {
        List<LightProfile> lightProfiles = lightProfileRepository.findByActiveTrue();
        List<LightProfileDto> dtos = lightProfiles.stream()
                .map(this::convertLightProfileToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<LightProfileDto> getLightProfileById(Long id) {
        LightProfile lightProfile = lightProfileRepository.findById(id).orElse(null);
        if (lightProfile == null) {
            return ApiResponse.error("Light profile not found");
        }
        return ApiResponse.success(convertLightProfileToDto(lightProfile));
    }

    @Override
    public ApiResponse<LightProfileDto> createLightProfile(LightProfileDto lightProfileDto) {
        LightProfile lightProfile = convertDtoToLightProfile(lightProfileDto);
        LightProfile saved = lightProfileRepository.save(lightProfile);
        return ApiResponse.success("Light profile created successfully", convertLightProfileToDto(saved));
    }

    @Override
    public ApiResponse<LightProfileDto> updateLightProfile(Long id, LightProfileDto lightProfileDto) {
        LightProfile existing = lightProfileRepository.findById(id).orElse(null);
        if (existing == null) {
            return ApiResponse.error("Light profile not found");
        }

        existing.setProfileType(lightProfileDto.getProfileType());
        existing.setPricePerMeter(lightProfileDto.getPricePerMeter());
        existing.setMrp(lightProfileDto.getMrp());
        existing.setDiscountPercentage(lightProfileDto.getDiscountPercentage());
        existing.setActive(lightProfileDto.getActive());

        LightProfile updated = lightProfileRepository.save(existing);
        return ApiResponse.success("Light profile updated successfully", convertLightProfileToDto(updated));
    }

    @Override
    public ApiResponse<String> deleteLightProfile(Long id) {
        LightProfile lightProfile = lightProfileRepository.findById(id).orElse(null);
        if (lightProfile == null) {
            return ApiResponse.error("Light profile not found");
        }

        lightProfile.setActive(false);
        lightProfileRepository.save(lightProfile);
        return ApiResponse.success("Light profile deleted successfully");
    }

    // Driver implementations
    @Override
    public ApiResponse<List<DriverDto>> getAllDrivers() {
        List<Driver> drivers = driverRepository.findAll();
        List<DriverDto> dtos = drivers.stream()
                .map(this::convertDriverToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<List<DriverDto>> getActiveDrivers() {
        List<Driver> drivers = driverRepository.findByActiveTrue();
        List<DriverDto> dtos = drivers.stream()
                .map(this::convertDriverToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<DriverDto> getDriverById(Long id) {
        Driver driver = driverRepository.findById(id).orElse(null);
        if (driver == null) {
            return ApiResponse.error("Driver not found");
        }
        return ApiResponse.success(convertDriverToDto(driver));
    }

    @Override
    public ApiResponse<DriverDto> createDriver(DriverDto driverDto) {
        Driver driver = convertDtoToDriver(driverDto);
        Driver saved = driverRepository.save(driver);
        return ApiResponse.success("Driver created successfully", convertDriverToDto(saved));
    }

    @Override
    public ApiResponse<DriverDto> updateDriver(Long id, DriverDto driverDto) {
        Driver existing = driverRepository.findById(id).orElse(null);
        if (existing == null) {
            return ApiResponse.error("Driver not found");
        }

        existing.setWattage(driverDto.getWattage());
        existing.setPrice(driverDto.getPrice());
        existing.setMrp(driverDto.getMrp());
        existing.setDiscountPercentage(driverDto.getDiscountPercentage());
        existing.setActive(driverDto.getActive());

        Driver updated = driverRepository.save(existing);
        return ApiResponse.success("Driver updated successfully", convertDriverToDto(updated));
    }

    @Override
    public ApiResponse<String> deleteDriver(Long id) {
        Driver driver = driverRepository.findById(id).orElse(null);
        if (driver == null) {
            return ApiResponse.error("Driver not found");
        }

        driver.setActive(false);
        driverRepository.save(driver);
        return ApiResponse.success("Driver deleted successfully");
    }

    // Connector implementations
    @Override
    public ApiResponse<List<ConnectorDto>> getAllConnectors() {
        List<Connector> connectors = connectorRepository.findAll();
        List<ConnectorDto> dtos = connectors.stream()
                .map(this::convertConnectorToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<List<ConnectorDto>> getActiveConnectors() {
        List<Connector> connectors = connectorRepository.findByActiveTrue();
        List<ConnectorDto> dtos = connectors.stream()
                .map(this::convertConnectorToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<ConnectorDto> getConnectorById(Long id) {
        Connector connector = connectorRepository.findById(id).orElse(null);
        if (connector == null) {
            return ApiResponse.error("Connector not found");
        }
        return ApiResponse.success(convertConnectorToDto(connector));
    }

    @Override
    public ApiResponse<ConnectorDto> createConnector(ConnectorDto connectorDto) {
        Connector connector = convertDtoToConnector(connectorDto);
        Connector saved = connectorRepository.save(connector);
        return ApiResponse.success("Connector created successfully", convertConnectorToDto(saved));
    }

    @Override
    public ApiResponse<ConnectorDto> updateConnector(Long id, ConnectorDto connectorDto) {
        Connector existing = connectorRepository.findById(id).orElse(null);
        if (existing == null) {
            return ApiResponse.error("Connector not found");
        }

        existing.setType(connectorDto.getType());
        existing.setPricePerPiece(connectorDto.getPricePerPiece());
        existing.setMrp(connectorDto.getMrp());
        existing.setDiscountPercentage(connectorDto.getDiscountPercentage());
        existing.setActive(connectorDto.getActive());

        Connector updated = connectorRepository.save(existing);
        return ApiResponse.success("Connector updated successfully", convertConnectorToDto(updated));
    }

    @Override
    public ApiResponse<String> deleteConnector(Long id) {
        Connector connector = connectorRepository.findById(id).orElse(null);
        if (connector == null) {
            return ApiResponse.error("Connector not found");
        }

        connector.setActive(false);
        connectorRepository.save(connector);
        return ApiResponse.success("Connector deleted successfully");
    }

    // Sensor implementations
    @Override
    public ApiResponse<List<SensorDto>> getAllSensors() {
        List<Sensor> sensors = sensorRepository.findAll();
        List<SensorDto> dtos = sensors.stream()
                .map(this::convertSensorToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<List<SensorDto>> getActiveSensors() {
        List<Sensor> sensors = sensorRepository.findByActiveTrue();
        List<SensorDto> dtos = sensors.stream()
                .map(this::convertSensorToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @Override
    public ApiResponse<SensorDto> getSensorById(Long id) {
        Sensor sensor = sensorRepository.findById(id).orElse(null);
        if (sensor == null) {
            return ApiResponse.error("Sensor not found");
        }
        return ApiResponse.success(convertSensorToDto(sensor));
    }

    @Override
    public ApiResponse<SensorDto> createSensor(SensorDto sensorDto) {
        Sensor sensor = convertDtoToSensor(sensorDto);
        Sensor saved = sensorRepository.save(sensor);
        return ApiResponse.success("Sensor created successfully", convertSensorToDto(saved));
    }

    @Override
    public ApiResponse<SensorDto> updateSensor(Long id, SensorDto sensorDto) {
        Sensor existing = sensorRepository.findById(id).orElse(null);
        if (existing == null) {
            return ApiResponse.error("Sensor not found");
        }

        existing.setType(sensorDto.getType());
        existing.setPricePerPiece(sensorDto.getPricePerPiece());
        existing.setMrp(sensorDto.getMrp());
        existing.setDiscountPercentage(sensorDto.getDiscountPercentage());
        existing.setActive(sensorDto.getActive());

        Sensor updated = sensorRepository.save(existing);
        return ApiResponse.success("Sensor updated successfully", convertSensorToDto(updated));
    }

    @Override
    public ApiResponse<String> deleteSensor(Long id) {
        Sensor sensor = sensorRepository.findById(id).orElse(null);
        if (sensor == null) {
            return ApiResponse.error("Sensor not found");
        }

        sensor.setActive(false);
        sensorRepository.save(sensor);
        return ApiResponse.success("Sensor deleted successfully");
    }

    // Conversion methods
    private LightProfileDto convertLightProfileToDto(LightProfile lightProfile) {
        return new LightProfileDto(
                lightProfile.getId(),
                lightProfile.getProfileType(),
                lightProfile.getPricePerMeter(),
                lightProfile.getMrp(),
                lightProfile.getDiscountPercentage(),
                lightProfile.getCompanyPrice(),
                lightProfile.getActive()
        );
    }

    private LightProfile convertDtoToLightProfile(LightProfileDto dto) {
        LightProfile lightProfile = new LightProfile();
        lightProfile.setProfileType(dto.getProfileType());
        lightProfile.setPricePerMeter(dto.getPricePerMeter());
        lightProfile.setMrp(dto.getMrp());
        lightProfile.setDiscountPercentage(dto.getDiscountPercentage());
        lightProfile.setActive(dto.getActive() != null ? dto.getActive() : true);
        return lightProfile;
    }

    private DriverDto convertDriverToDto(Driver driver) {
        return new DriverDto(
                driver.getId(),
                driver.getWattage(),
                driver.getPrice(),
                driver.getMrp(),
                driver.getDiscountPercentage(),
                driver.getCompanyPrice(),
                driver.getActive()
        );
    }

    private Driver convertDtoToDriver(DriverDto dto) {
        Driver driver = new Driver();
        driver.setWattage(dto.getWattage());
        driver.setPrice(dto.getPrice());
        driver.setMrp(dto.getMrp());
        driver.setDiscountPercentage(dto.getDiscountPercentage());
        driver.setActive(dto.getActive() != null ? dto.getActive() : true);
        return driver;
    }

    private ConnectorDto convertConnectorToDto(Connector connector) {
        return new ConnectorDto(
                connector.getId(),
                connector.getType(),
                connector.getPricePerPiece(),
                connector.getMrp(),
                connector.getDiscountPercentage(),
                connector.getCompanyPrice(),
                connector.getActive()
        );
    }

    private Connector convertDtoToConnector(ConnectorDto dto) {
        Connector connector = new Connector();
        connector.setType(dto.getType());
        connector.setPricePerPiece(dto.getPricePerPiece());
        connector.setMrp(dto.getMrp());
        connector.setDiscountPercentage(dto.getDiscountPercentage());
        connector.setActive(dto.getActive() != null ? dto.getActive() : true);
        return connector;
    }

    private SensorDto convertSensorToDto(Sensor sensor) {
        return new SensorDto(
                sensor.getId(),
                sensor.getType(),
                sensor.getPricePerPiece(),
                sensor.getMrp(),
                sensor.getDiscountPercentage(),
                sensor.getCompanyPrice(),
                sensor.getActive()
        );
    }

    private Sensor convertDtoToSensor(SensorDto dto) {
        Sensor sensor = new Sensor();
        sensor.setType(dto.getType());
        sensor.setPricePerPiece(dto.getPricePerPiece());
        sensor.setMrp(dto.getMrp());
        sensor.setDiscountPercentage(dto.getDiscountPercentage());
        sensor.setActive(dto.getActive() != null ? dto.getActive() : true);
        return sensor;
    }
}