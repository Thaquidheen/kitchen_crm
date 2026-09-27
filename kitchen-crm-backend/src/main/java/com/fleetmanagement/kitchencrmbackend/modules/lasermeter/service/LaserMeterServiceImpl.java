package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.DeviceLabLogDto;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.DeviceLabLogRequest;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.LaserMeterAdapterAuditDto;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.LaserMeterAdapterDto;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.LaserMeterAdapterRequest;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.entity.DeviceLabLog;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.entity.LaserMeterAdapter;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.entity.LaserMeterAdapterAudit;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.repository.DeviceLabLogRepository;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.repository.LaserMeterAdapterAuditRepository;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.repository.LaserMeterAdapterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class LaserMeterServiceImpl implements LaserMeterService {

    /** Lab exports are raw packet logs; this is generous for a session yet bounded. */
    private static final int MAX_LAB_LOG_BYTES = 2 * 1024 * 1024;

    @Autowired
    private LaserMeterAdapterRepository adapterRepository;

    @Autowired
    private LaserMeterAdapterAuditRepository auditRepository;

    @Autowired
    private DeviceLabLogRepository labLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${app.business-timezone:Asia/Kolkata}")
    private String businessTimezone;

    private ZoneId zone() {
        return ZoneId.of(businessTimezone);
    }

    private LocalDateTime now() {
        return LocalDateTime.now(zone());
    }

    private String format(LocalDateTime t) {
        return t == null ? null : t.atZone(zone()).toOffsetDateTime().toString();
    }

    // ------------------------------------------------------------------ adapters

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<LaserMeterAdapterDto>> getActiveAdapters() {
        return ApiResponse.success(adapterRepository.findByActiveTrueOrderByDisplayNameAsc()
                .stream().map(this::toDto).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<LaserMeterAdapterDto>> getAllAdapters() {
        return ApiResponse.success(adapterRepository.findAllByOrderByDisplayNameAsc()
                .stream().map(this::toDto).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<LaserMeterAdapterDto> getAdapter(Long id) {
        return adapterRepository.findById(id)
                .map(a -> ApiResponse.success(toDto(a)))
                .orElseGet(() -> ApiResponse.error("Adapter not found"));
    }

    @Override
    public ApiResponse<LaserMeterAdapterDto> createAdapter(LaserMeterAdapterRequest request,
                                                          String actorEmail, String actorName) {
        String key = request.getAdapterKey().trim();
        List<String> errors = LaserMeterAdapterValidator.validate(key, request.getDisplayName(), request.getConfig());
        if (!errors.isEmpty()) {
            return ApiResponse.error(String.join("; ", errors));
        }
        if (adapterRepository.existsByAdapterKey(key)) {
            return ApiResponse.error("An adapter with ID \"" + key + "\" already exists");
        }
        LaserMeterAdapter a = new LaserMeterAdapter();
        a.setAdapterKey(key);
        apply(a, request);
        a.setCreatedBy(actorName);
        a.setUpdatedBy(actorName);
        a.setCreatedAt(now());
        a.setUpdatedAt(a.getCreatedAt());
        a = adapterRepository.save(a);
        audit(a.getId(), key, LaserMeterAdapterAudit.Action.CREATE, null, a.getConfig(), actorEmail, actorName);
        return ApiResponse.success("Adapter created", toDto(a));
    }

    @Override
    public ApiResponse<LaserMeterAdapterDto> updateAdapter(Long id, LaserMeterAdapterRequest request,
                                                          String actorEmail, String actorName) {
        LaserMeterAdapter a = adapterRepository.findById(id).orElse(null);
        if (a == null) {
            return ApiResponse.error("Adapter not found");
        }
        if (!a.getAdapterKey().equals(request.getAdapterKey().trim())) {
            return ApiResponse.error("The adapter ID can't be changed: saved measurements refer to it. "
                    + "Create a new adapter instead.");
        }
        List<String> errors = LaserMeterAdapterValidator.validate(a.getAdapterKey(), request.getDisplayName(),
                request.getConfig());
        if (!errors.isEmpty()) {
            return ApiResponse.error(String.join("; ", errors));
        }
        Map<String, Object> before = copy(a.getConfig());
        apply(a, request);
        a.setUpdatedBy(actorName);
        a.setUpdatedAt(now());
        a = adapterRepository.save(a);
        audit(a.getId(), a.getAdapterKey(), LaserMeterAdapterAudit.Action.UPDATE, before, a.getConfig(),
                actorEmail, actorName);
        return ApiResponse.success("Adapter updated", toDto(a));
    }

    @Override
    public ApiResponse<String> deleteAdapter(Long id, String actorEmail, String actorName) {
        LaserMeterAdapter a = adapterRepository.findById(id).orElse(null);
        if (a == null) {
            return ApiResponse.error("Adapter not found");
        }
        audit(a.getId(), a.getAdapterKey(), LaserMeterAdapterAudit.Action.DELETE, copy(a.getConfig()), null,
                actorEmail, actorName);
        adapterRepository.delete(a);
        return ApiResponse.success("Adapter deleted", a.getAdapterKey());
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<LaserMeterAdapterAuditDto>> getAdapterAudit(Long adapterId) {
        return ApiResponse.success(auditRepository.findByAdapterIdOrderByCreatedAtDescIdDesc(adapterId)
                .stream().map(this::toDto).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<LaserMeterAdapterAuditDto>> getRecentAudit(int limit) {
        int size = Math.min(Math.max(limit, 1), 200);
        return ApiResponse.success(auditRepository.findAllByOrderByCreatedAtDescIdDesc(PageRequest.of(0, size))
                .stream().map(this::toDto).toList());
    }

    /** Copy request fields onto the entity; the JSON's id/displayName/active mirror the columns. */
    private void apply(LaserMeterAdapter a, LaserMeterAdapterRequest request) {
        a.setDisplayName(request.getDisplayName().trim());
        a.setActive(request.getActive() == null || request.getActive());
        Map<String, Object> config = copy(request.getConfig());
        config.put("id", a.getAdapterKey());
        config.put("displayName", a.getDisplayName());
        config.put("active", a.getActive());
        a.setConfig(config);
    }

    private void audit(Long adapterId, String key, LaserMeterAdapterAudit.Action action,
                       Map<String, Object> before, Map<String, Object> after, String actorEmail, String actorName) {
        LaserMeterAdapterAudit row = new LaserMeterAdapterAudit();
        row.setAdapterId(adapterId);
        row.setAdapterKey(key);
        row.setAction(action);
        row.setBeforeConfig(before);
        row.setAfterConfig(after == null ? null : copy(after));
        row.setActorEmail(actorEmail);
        row.setActorName(actorName);
        row.setCreatedAt(now());
        auditRepository.save(row);
    }

    private static Map<String, Object> copy(Map<String, Object> m) {
        return m == null ? null : new LinkedHashMap<>(m);
    }

    // ------------------------------------------------------------------ device lab logs

    @Override
    public ApiResponse<DeviceLabLogDto> saveLabLog(DeviceLabLogRequest request, String actorName) {
        try {
            if (objectMapper.writeValueAsBytes(request.getLog()).length > MAX_LAB_LOG_BYTES) {
                return ApiResponse.error("Log is too large to store (max 2 MB). Export it to a file instead.");
            }
        } catch (JsonProcessingException e) {
            return ApiResponse.error("Log is not valid JSON");
        }
        DeviceLabLog log = new DeviceLabLog();
        log.setTitle(request.getTitle().trim());
        log.setDeviceName(request.getDeviceName());
        log.setAdapterKey(request.getAdapterKey());
        log.setNotes(request.getNotes());
        log.setLog(request.getLog());
        Object entries = request.getLog().get("entries");
        log.setEntryCount(entries instanceof Collection<?> c ? c.size() : 0);
        log.setCreatedBy(actorName);
        log.setCreatedAt(now());
        return ApiResponse.success("Lab log saved", toDto(labLogRepository.save(log), true));
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<DeviceLabLogDto>> getLabLogs(int limit) {
        int size = Math.min(Math.max(limit, 1), 200);
        return ApiResponse.success(labLogRepository.findAllByOrderByCreatedAtDescIdDesc(PageRequest.of(0, size))
                .stream().map(l -> toDto(l, false)).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<DeviceLabLogDto> getLabLog(Long id) {
        return labLogRepository.findById(id)
                .map(l -> ApiResponse.success(toDto(l, true)))
                .orElseGet(() -> ApiResponse.error("Lab log not found"));
    }

    // ------------------------------------------------------------------ mapping

    private LaserMeterAdapterDto toDto(LaserMeterAdapter a) {
        LaserMeterAdapterDto d = new LaserMeterAdapterDto();
        d.setId(a.getId());
        d.setAdapterKey(a.getAdapterKey());
        d.setDisplayName(a.getDisplayName());
        d.setActive(a.getActive());
        d.setConfig(a.getConfig());
        d.setCreatedBy(a.getCreatedBy());
        d.setUpdatedBy(a.getUpdatedBy());
        d.setCreatedAt(format(a.getCreatedAt()));
        d.setUpdatedAt(format(a.getUpdatedAt()));
        return d;
    }

    private LaserMeterAdapterAuditDto toDto(LaserMeterAdapterAudit r) {
        LaserMeterAdapterAuditDto d = new LaserMeterAdapterAuditDto();
        d.setId(r.getId());
        d.setAdapterId(r.getAdapterId());
        d.setAdapterKey(r.getAdapterKey());
        d.setAction(r.getAction().name());
        d.setBeforeConfig(r.getBeforeConfig());
        d.setAfterConfig(r.getAfterConfig());
        d.setActorEmail(r.getActorEmail());
        d.setActorName(r.getActorName());
        d.setCreatedAt(format(r.getCreatedAt()));
        return d;
    }

    private DeviceLabLogDto toDto(DeviceLabLog l, boolean withLog) {
        DeviceLabLogDto d = new DeviceLabLogDto();
        d.setId(l.getId());
        d.setTitle(l.getTitle());
        d.setDeviceName(l.getDeviceName());
        d.setAdapterKey(l.getAdapterKey());
        d.setNotes(l.getNotes());
        d.setEntryCount(l.getEntryCount());
        d.setLog(withLog ? l.getLog() : null);
        d.setCreatedBy(l.getCreatedBy());
        d.setCreatedAt(format(l.getCreatedAt()));
        return d;
    }
}
