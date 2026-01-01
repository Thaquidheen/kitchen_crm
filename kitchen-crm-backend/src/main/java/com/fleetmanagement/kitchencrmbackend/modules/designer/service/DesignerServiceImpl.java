package com.fleetmanagement.kitchencrmbackend.modules.designer.service;

import com.fleetmanagement.kitchencrmbackend.modules.designer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.designer.entity.Designer;
import com.fleetmanagement.kitchencrmbackend.modules.designer.repository.DesignerRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class DesignerServiceImpl implements DesignerService {

    @Autowired
    private DesignerRepository designerRepository;

    @Override
    public ApiResponse<Page<DesignerDto>> getAllDesigners(Pageable pageable) {
        Page<Designer> designers = designerRepository.findAll(pageable);
        Page<DesignerDto> designerDtos = designers.map(this::convertToDto);
        return ApiResponse.success(designerDtos);
    }

    @Override
    public ApiResponse<List<DesignerDto>> getActiveDesigners() {
        List<Designer> designers = designerRepository.findByActiveTrue();
        List<DesignerDto> designerDtos = designers.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(designerDtos);
    }

    @Override
    public ApiResponse<List<DesignerDto>> getAvailableDesigners() {
        List<Designer> designers = designerRepository.findAvailableDesigners();
        List<DesignerDto> designerDtos = designers.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(designerDtos);
    }

    @Override
    public ApiResponse<DesignerDto> getDesignerById(Long id) {
        Designer designer = designerRepository.findById(id).orElse(null);
        if (designer == null) {
            return ApiResponse.error("Designer not found");
        }
        return ApiResponse.success(convertToDto(designer));
    }

    @Override
    public ApiResponse<DesignerDto> getDesignerByEmail(String email) {
        Designer designer = designerRepository.findByEmail(email).orElse(null);
        if (designer == null) {
            return ApiResponse.error("Designer not found");
        }
        return ApiResponse.success(convertToDto(designer));
    }

    @Override
    public ApiResponse<DesignerDto> createDesigner(DesignerCreateDto designerCreateDto) {
        if (designerRepository.existsByEmail(designerCreateDto.getEmail())) {
            return ApiResponse.error("Email is already taken!");
        }

        Designer designer = new Designer();
        designer.setName(designerCreateDto.getName());
        designer.setEmail(designerCreateDto.getEmail());
        designer.setPhoneNumber(designerCreateDto.getPhoneNumber());
        designer.setDepartment(designerCreateDto.getDepartment());
        designer.setSpecialization(designerCreateDto.getSpecialization());
        designer.setExperienceYears(designerCreateDto.getExperienceYears());
        designer.setHourlyRate(designerCreateDto.getHourlyRate());
        designer.setBio(designerCreateDto.getBio());
        designer.setSkills(designerCreateDto.getSkills());
        designer.setPortfolioUrl(designerCreateDto.getPortfolioUrl());
        designer.setMaxConcurrentProjects(designerCreateDto.getMaxConcurrentProjects());
        designer.setAverageCompletionDays(designerCreateDto.getAverageCompletionDays());

        Designer savedDesigner = designerRepository.save(designer);
        return ApiResponse.success("Designer created successfully", convertToDto(savedDesigner));
    }

    @Override
    public ApiResponse<DesignerDto> updateDesigner(Long id, DesignerUpdateDto designerUpdateDto) {
        Designer designer = designerRepository.findById(id).orElse(null);
        if (designer == null) {
            return ApiResponse.error("Designer not found");
        }

        designer.setName(designerUpdateDto.getName());
        designer.setPhoneNumber(designerUpdateDto.getPhoneNumber());
        designer.setDepartment(designerUpdateDto.getDepartment());
        designer.setSpecialization(designerUpdateDto.getSpecialization());
        designer.setExperienceYears(designerUpdateDto.getExperienceYears());
        designer.setHourlyRate(designerUpdateDto.getHourlyRate());
        designer.setActive(designerUpdateDto.getActive());
        designer.setBio(designerUpdateDto.getBio());
        designer.setSkills(designerUpdateDto.getSkills());
        designer.setPortfolioUrl(designerUpdateDto.getPortfolioUrl());
        designer.setMaxConcurrentProjects(designerUpdateDto.getMaxConcurrentProjects());
        designer.setAverageCompletionDays(designerUpdateDto.getAverageCompletionDays());

        Designer updatedDesigner = designerRepository.save(designer);
        return ApiResponse.success("Designer updated successfully", convertToDto(updatedDesigner));
    }

    @Override
    public ApiResponse<String> deleteDesigner(Long id) {
        Designer designer = designerRepository.findById(id).orElse(null);
        if (designer == null) {
            return ApiResponse.error("Designer not found");
        }

        designerRepository.delete(designer);
        return ApiResponse.success("Designer deleted successfully");
    }

    @Override
    public ApiResponse<String> toggleDesignerStatus(Long id) {
        Designer designer = designerRepository.findById(id).orElse(null);
        if (designer == null) {
            return ApiResponse.error("Designer not found");
        }

        designer.setActive(!designer.getActive());
        designerRepository.save(designer);
        
        String status = designer.getActive() ? "activated" : "deactivated";
        return ApiResponse.success("Designer " + status + " successfully");
    }

    @Override
    public ApiResponse<List<DesignerDto>> searchDesigners(String query) {
        List<Designer> designers = designerRepository.findByNameContainingIgnoreCase(query);
        List<DesignerDto> designerDtos = designers.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(designerDtos);
    }

    @Override
    public ApiResponse<List<DesignerDto>> getDesignersByDepartment(String department) {
        List<Designer> designers = designerRepository.findByDepartment(department);
        List<DesignerDto> designerDtos = designers.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(designerDtos);
    }

    @Override
    public ApiResponse<List<DesignerDto>> getDesignersBySpecialization(String specialization) {
        List<Designer> designers = designerRepository.findBySpecializationContaining(specialization);
        List<DesignerDto> designerDtos = designers.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(designerDtos);
    }

    @Override
    public ApiResponse<Map<String, Object>> getDesignerStatistics() {
        Map<String, Object> stats = Map.of(
            "totalDesigners", designerRepository.count(),
            "activeDesigners", designerRepository.countActiveDesigners(),
            "availableDesigners", designerRepository.findAvailableDesigners().size()
        );
        return ApiResponse.success(stats);
    }

    // Helper method to convert entity to DTO
    private DesignerDto convertToDto(Designer designer) {
        DesignerDto dto = new DesignerDto();
        dto.setId(designer.getId());
        dto.setName(designer.getName());
        dto.setEmail(designer.getEmail());
        dto.setPhoneNumber(designer.getPhoneNumber());
        dto.setDepartment(designer.getDepartment());
        dto.setSpecialization(designer.getSpecialization());
        dto.setExperienceYears(designer.getExperienceYears());
        dto.setHourlyRate(designer.getHourlyRate());
        dto.setActive(designer.getActive());
        dto.setBio(designer.getBio());
        dto.setSkills(designer.getSkills());
        dto.setPortfolioUrl(designer.getPortfolioUrl());
        dto.setMaxConcurrentProjects(designer.getMaxConcurrentProjects());
        dto.setAverageCompletionDays(designer.getAverageCompletionDays());
        dto.setCreatedAt(designer.getCreatedAt());
        dto.setUpdatedAt(designer.getUpdatedAt());
        
        // Computed fields (these would be calculated from related entities in a real scenario)
        dto.setCurrentProjects(0); // TODO: Calculate from design phases
        dto.setCompletedProjects(0); // TODO: Calculate from completed design phases
        dto.setAverageRating(0.0); // TODO: Calculate from feedback/ratings
        dto.setAvailable(designer.isAvailable());
        
        return dto;
    }
}
