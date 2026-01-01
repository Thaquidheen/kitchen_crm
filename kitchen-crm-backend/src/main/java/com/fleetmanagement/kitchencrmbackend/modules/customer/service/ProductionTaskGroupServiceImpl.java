package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionTaskGroupCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionTaskGroupDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionTaskGroupUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionInstallation;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionTaskGroup;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionInstallationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionTaskGroupRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductionTaskGroupServiceImpl implements ProductionTaskGroupService {

    private final ProductionTaskGroupRepository groupRepository;
    private final ProductionInstallationRepository productionInstallationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ApiResponse<ProductionTaskGroupDto> createGroup(ProductionTaskGroupCreateDto createDto) {
        try {
            // Find production installation by customer ID
            Optional<ProductionInstallation> productionOpt = productionInstallationRepository
                    .findByCustomerId(createDto.getCustomerId());

            if (productionOpt.isEmpty()) {
                return ApiResponse.error("No production installation found for customer ID: " + createDto.getCustomerId());
            }

            ProductionInstallation production = productionOpt.get();
            User currentUser = getCurrentUser();

            ProductionTaskGroup group = new ProductionTaskGroup();
            group.setProductionInstallation(production);
            group.setGroupTitle(createDto.getGroupTitle());
            group.setGroupDescription(createDto.getGroupDescription());
            group.setCreatedByUser(currentUser);
            group.setIsExpanded(true);

            // Set sort order
            if (createDto.getSortOrder() != null) {
                group.setSortOrder(createDto.getSortOrder());
            } else {
                Long count = groupRepository.countByCustomerId(createDto.getCustomerId());
                group.setSortOrder(count.intValue());
            }

            ProductionTaskGroup savedGroup = groupRepository.save(group);
            log.info("Created task group '{}' for customer ID: {}", savedGroup.getGroupTitle(), createDto.getCustomerId());

            return ApiResponse.success("Task group created successfully", ProductionTaskGroupDto.fromEntity(savedGroup));
        } catch (Exception e) {
            log.error("Error creating task group: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to create task group: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ApiResponse<ProductionTaskGroupDto> updateGroup(Long groupId, ProductionTaskGroupUpdateDto updateDto) {
        try {
            Optional<ProductionTaskGroup> groupOpt = groupRepository.findById(groupId);
            if (groupOpt.isEmpty()) {
                return ApiResponse.error("Task group not found with ID: " + groupId);
            }

            ProductionTaskGroup group = groupOpt.get();

            if (updateDto.getGroupTitle() != null) {
                group.setGroupTitle(updateDto.getGroupTitle());
            }
            if (updateDto.getGroupDescription() != null) {
                group.setGroupDescription(updateDto.getGroupDescription());
            }
            if (updateDto.getSortOrder() != null) {
                group.setSortOrder(updateDto.getSortOrder());
            }
            if (updateDto.getIsExpanded() != null) {
                group.setIsExpanded(updateDto.getIsExpanded());
            }

            ProductionTaskGroup savedGroup = groupRepository.save(group);
            log.info("Updated task group ID: {}", groupId);

            return ApiResponse.success("Task group updated successfully", ProductionTaskGroupDto.fromEntity(savedGroup));
        } catch (Exception e) {
            log.error("Error updating task group: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to update task group: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<ProductionTaskGroupDto>> getGroupsByCustomerId(Long customerId) {
        try {
            List<ProductionTaskGroup> groups = groupRepository.findByCustomerIdWithTasks(customerId);
            List<ProductionTaskGroupDto> dtos = groups.stream()
                    .map(ProductionTaskGroupDto::fromEntity)
                    .collect(Collectors.toList());

            return ApiResponse.success("Task groups retrieved successfully", dtos);
        } catch (Exception e) {
            log.error("Error fetching task groups for customer: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to fetch task groups: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<ProductionTaskGroupDto> getGroupById(Long groupId) {
        try {
            Optional<ProductionTaskGroup> groupOpt = groupRepository.findById(groupId);
            if (groupOpt.isEmpty()) {
                return ApiResponse.error("Task group not found with ID: " + groupId);
            }

            return ApiResponse.success("Task group retrieved successfully", ProductionTaskGroupDto.fromEntity(groupOpt.get()));
        } catch (Exception e) {
            log.error("Error fetching task group: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to fetch task group: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ApiResponse<Void> deleteGroup(Long groupId) {
        try {
            Optional<ProductionTaskGroup> groupOpt = groupRepository.findById(groupId);
            if (groupOpt.isEmpty()) {
                return ApiResponse.error("Task group not found with ID: " + groupId);
            }

            groupRepository.deleteById(groupId);
            log.info("Deleted task group ID: {}", groupId);

            return ApiResponse.success("Task group deleted successfully", null);
        } catch (Exception e) {
            log.error("Error deleting task group: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to delete task group: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ApiResponse<List<ProductionTaskGroupDto>> reorderGroups(Long customerId, List<Long> groupIds) {
        try {
            List<ProductionTaskGroupDto> reorderedGroups = new ArrayList<>();

            for (int i = 0; i < groupIds.size(); i++) {
                Optional<ProductionTaskGroup> groupOpt = groupRepository.findById(groupIds.get(i));
                if (groupOpt.isPresent()) {
                    ProductionTaskGroup group = groupOpt.get();
                    group.setSortOrder(i);
                    ProductionTaskGroup savedGroup = groupRepository.save(group);
                    reorderedGroups.add(ProductionTaskGroupDto.fromEntity(savedGroup));
                }
            }

            log.info("Reordered {} task groups for customer ID: {}", groupIds.size(), customerId);
            return ApiResponse.success("Task groups reordered successfully", reorderedGroups);
        } catch (Exception e) {
            log.error("Error reordering task groups: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to reorder task groups: " + e.getMessage());
        }
    }

    private User getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getName() != null) {
                return userRepository.findByEmail(authentication.getName()).orElse(null);
            }
        } catch (Exception e) {
            log.warn("Could not get current user: {}", e.getMessage());
        }
        return null;
    }
}
