package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.DeviceLabLogDto;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.DeviceLabLogRequest;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.LaserMeterAdapterAuditDto;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.LaserMeterAdapterDto;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.LaserMeterAdapterRequest;

import java.util.List;

public interface LaserMeterService {

    /** Active adapters for surveyors' devices. */
    ApiResponse<List<LaserMeterAdapterDto>> getActiveAdapters();

    ApiResponse<List<LaserMeterAdapterDto>> getAllAdapters();

    ApiResponse<LaserMeterAdapterDto> getAdapter(Long id);

    ApiResponse<LaserMeterAdapterDto> createAdapter(LaserMeterAdapterRequest request, String actorEmail, String actorName);

    /** The adapter key is immutable: stored measurements reference it. */
    ApiResponse<LaserMeterAdapterDto> updateAdapter(Long id, LaserMeterAdapterRequest request, String actorEmail, String actorName);

    ApiResponse<String> deleteAdapter(Long id, String actorEmail, String actorName);

    ApiResponse<List<LaserMeterAdapterAuditDto>> getAdapterAudit(Long adapterId);

    ApiResponse<List<LaserMeterAdapterAuditDto>> getRecentAudit(int limit);

    ApiResponse<DeviceLabLogDto> saveLabLog(DeviceLabLogRequest request, String actorName);

    ApiResponse<List<DeviceLabLogDto>> getLabLogs(int limit);

    ApiResponse<DeviceLabLogDto> getLabLog(Long id);
}
