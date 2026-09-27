package com.fleetmanagement.kitchencrmbackend.modules.measurement.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.measurement.dto.SiteMeasurementDto;
import com.fleetmanagement.kitchencrmbackend.modules.measurement.dto.SiteMeasurementSaveRequest;
import com.fleetmanagement.kitchencrmbackend.modules.measurement.dto.SiteMeasurementValueDto;
import com.fleetmanagement.kitchencrmbackend.modules.measurement.entity.SiteMeasurement;
import com.fleetmanagement.kitchencrmbackend.modules.measurement.entity.SiteMeasurementValue;
import com.fleetmanagement.kitchencrmbackend.modules.measurement.repository.SiteMeasurementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class SiteMeasurementServiceImpl implements SiteMeasurementService {

    private static final int RAW_MAX = 500;

    @Autowired
    private SiteMeasurementRepository repository;

    @Autowired
    private CustomerRepository customerRepository;

    @Value("${app.business-timezone:Asia/Kolkata}")
    private String businessTimezone;

    private ZoneId zone() {
        return ZoneId.of(businessTimezone);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<SiteMeasurementDto> getForCustomer(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            return ApiResponse.error("Customer not found");
        }
        return repository.findByCustomerId(customerId)
                .map(sm -> ApiResponse.success(toDto(sm)))
                .orElseGet(() -> {
                    SiteMeasurementDto empty = new SiteMeasurementDto();
                    empty.setCustomerId(customerId);
                    return ApiResponse.success(empty);
                });
    }

    @Override
    public ApiResponse<SiteMeasurementDto> saveForCustomer(Long customerId, SiteMeasurementSaveRequest request,
                                                           String actor) {
        if (!customerRepository.existsById(customerId)) {
            return ApiResponse.error("Customer not found");
        }
        Set<String> seen = new HashSet<>();
        for (SiteMeasurementValueDto v : request.getValues()) {
            if (!seen.add(v.getKey())) {
                return ApiResponse.error("Duplicate measurement key: " + v.getKey());
            }
        }

        LocalDateTime now = LocalDateTime.now(zone());
        SiteMeasurement sm = repository.findByCustomerId(customerId).orElseGet(() -> {
            SiteMeasurement created = new SiteMeasurement();
            created.setCustomerId(customerId);
            created.setCreatedAt(now);
            return created;
        });
        sm.setLayout(request.getLayout());
        sm.setNotes(request.getNotes());
        sm.setUpdatedBy(actor);
        sm.setUpdatedAt(now);

        // Update rows in place (keeps ids stable), add new keys, drop keys no longer sent.
        Map<String, SiteMeasurementValue> existing = sm.getValues().stream()
                .collect(Collectors.toMap(SiteMeasurementValue::getFieldKey, Function.identity(), (a, b) -> a));
        sm.getValues().removeIf(v -> !seen.contains(v.getFieldKey()));
        for (SiteMeasurementValueDto dto : request.getValues()) {
            SiteMeasurementValue row = existing.get(dto.getKey());
            if (row == null) {
                row = new SiteMeasurementValue();
                row.setSiteMeasurement(sm);
                row.setFieldKey(dto.getKey());
                sm.getValues().add(row);
            }
            row.setValueMm(dto.getValueMm());
            row.setSource(dto.getSource());
            row.setDeviceAdapterId(SiteMeasurementValue.SOURCE_LASER_BLE.equals(dto.getSource())
                    ? blankToNull(dto.getDeviceAdapterId()) : null);
            row.setRaw(truncate(blankToNull(dto.getRaw())));
            row.setCapturedAt(parseInstant(dto.getCapturedAt(), now));
            row.setEditedAfterCapture(Boolean.TRUE.equals(dto.getEditedAfterCapture()));
        }

        return ApiResponse.success("Measurements saved", toDto(repository.save(sm)));
    }

    /** ISO instant from the client → naive business-timezone wall-clock (the app's convention). */
    private LocalDateTime parseInstant(String iso, LocalDateTime fallback) {
        if (iso == null || iso.isBlank()) {
            return fallback;
        }
        try {
            return OffsetDateTime.parse(iso).atZoneSameInstant(zone()).toLocalDateTime();
        } catch (DateTimeParseException e) {
            return fallback;
        }
    }

    private String formatInstant(LocalDateTime t) {
        return t == null ? null : t.atZone(zone()).toOffsetDateTime().toString();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }

    private static String truncate(String s) {
        return s != null && s.length() > RAW_MAX ? s.substring(0, RAW_MAX) : s;
    }

    private SiteMeasurementDto toDto(SiteMeasurement sm) {
        SiteMeasurementDto dto = new SiteMeasurementDto();
        dto.setCustomerId(sm.getCustomerId());
        dto.setLayout(sm.getLayout() == null ? null : new HashMap<>(sm.getLayout()));
        dto.setNotes(sm.getNotes());
        dto.setUpdatedBy(sm.getUpdatedBy());
        dto.setUpdatedAt(formatInstant(sm.getUpdatedAt()));
        List<SiteMeasurementValueDto> values = sm.getValues().stream().map(v -> {
            SiteMeasurementValueDto d = new SiteMeasurementValueDto();
            d.setKey(v.getFieldKey());
            d.setValueMm(v.getValueMm());
            d.setSource(v.getSource());
            d.setDeviceAdapterId(v.getDeviceAdapterId());
            d.setRaw(v.getRaw());
            d.setCapturedAt(formatInstant(v.getCapturedAt()));
            d.setEditedAfterCapture(Boolean.TRUE.equals(v.getEditedAfterCapture()));
            return d;
        }).collect(Collectors.toList());
        dto.setValues(values);
        return dto;
    }
}
