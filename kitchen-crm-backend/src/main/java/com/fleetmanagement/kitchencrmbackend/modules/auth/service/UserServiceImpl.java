package com.fleetmanagement.kitchencrmbackend.modules.auth.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.UserCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.UserDto;
import com.fleetmanagement.kitchencrmbackend.modules.auth.dto.UserUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.Role;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.RoleRepository;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.modules.notification.dto.EmailRequest;
import com.fleetmanagement.kitchencrmbackend.modules.notification.service.EmailService;
import com.fleetmanagement.kitchencrmbackend.modules.notification.service.EmailTemplateService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class UserServiceImpl implements UserService {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private EmailService emailService;

    @Autowired
    private EmailTemplateService emailTemplateService;

    @Value("${app.frontend.url:${FRONTEND_URL:http://localhost:5173}}")
    private String frontendUrl;

    @Override
    public ApiResponse<List<UserDto>> getAllStaff() {
        try {
            List<User> staffUsers = userRepository.findByRoles_Name(Role.RoleName.ROLE_STAFF);
            List<UserDto> staffDtos = staffUsers.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            return ApiResponse.success(staffDtos);
        } catch (Exception e) {
            log.error("Error fetching staff users", e);
            return ApiResponse.error("Failed to fetch staff users: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<UserDto> getStaffById(Long id) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ApiResponse.error("Staff user not found");
            }

            // Verify user has ROLE_STAFF
            boolean isStaff = user.getRoles().stream()
                    .anyMatch(role -> role.getName() == Role.RoleName.ROLE_STAFF);
            if (!isStaff) {
                return ApiResponse.error("User is not a staff member");
            }

            return ApiResponse.success(convertToDto(user));
        } catch (Exception e) {
            log.error("Error fetching staff user by ID: {}", id, e);
            return ApiResponse.error("Failed to fetch staff user: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<UserDto> createStaff(UserCreateDto userCreateDto) {
        try {
            // Check if email already exists
            if (userRepository.existsByEmail(userCreateDto.getEmail())) {
                return ApiResponse.error("Email is already taken!");
            }

            // Store plain password temporarily for email
            String plainPassword = userCreateDto.getPassword();

            // Create user
            User user = new User();
            user.setName(userCreateDto.getName());
            user.setEmail(userCreateDto.getEmail());
            user.setPassword(passwordEncoder.encode(plainPassword));
            user.setPhoneNumber(userCreateDto.getPhoneNumber());
            user.setActive(true);

            // Assign ROLE_STAFF
            Role staffRole = roleRepository.findByName(Role.RoleName.ROLE_STAFF)
                    .orElseThrow(() -> new RuntimeException("Error: ROLE_STAFF is not found."));
            user.setRoles(Set.of(staffRole));

            // Save user
            User savedUser = userRepository.save(user);

            // Send login credentials email
            sendCredentialsEmail(savedUser, plainPassword);

            // Clear plain password from memory (security best practice)
            plainPassword = null;

            return ApiResponse.success("Staff created successfully. Login credentials have been sent to their email.", convertToDto(savedUser));
        } catch (Exception e) {
            log.error("Error creating staff user", e);
            return ApiResponse.error("Failed to create staff user: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<UserDto> updateStaff(Long id, UserUpdateDto userUpdateDto) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ApiResponse.error("Staff user not found");
            }

            // Verify user has ROLE_STAFF
            boolean isStaff = user.getRoles().stream()
                    .anyMatch(role -> role.getName() == Role.RoleName.ROLE_STAFF);
            if (!isStaff) {
                return ApiResponse.error("User is not a staff member");
            }

            // Check email uniqueness if email is being changed
            if (userUpdateDto.getEmail() != null && !userUpdateDto.getEmail().equals(user.getEmail())) {
                if (userRepository.existsByEmail(userUpdateDto.getEmail())) {
                    return ApiResponse.error("Email is already taken!");
                }
                user.setEmail(userUpdateDto.getEmail());
            }

            // Update fields
            if (userUpdateDto.getName() != null) {
                user.setName(userUpdateDto.getName());
            }
            if (userUpdateDto.getPhoneNumber() != null) {
                user.setPhoneNumber(userUpdateDto.getPhoneNumber());
            }
            if (userUpdateDto.getActive() != null) {
                user.setActive(userUpdateDto.getActive());
            }

            User updatedUser = userRepository.save(user);
            return ApiResponse.success("Staff updated successfully", convertToDto(updatedUser));
        } catch (Exception e) {
            log.error("Error updating staff user: {}", id, e);
            return ApiResponse.error("Failed to update staff user: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<String> deleteStaff(Long id) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ApiResponse.error("Staff user not found");
            }

            // Verify user has ROLE_STAFF
            boolean isStaff = user.getRoles().stream()
                    .anyMatch(role -> role.getName() == Role.RoleName.ROLE_STAFF);
            if (!isStaff) {
                return ApiResponse.error("User is not a staff member");
            }

            // Soft delete - set active to false
            user.setActive(false);
            userRepository.save(user);

            return ApiResponse.success("Staff deactivated successfully");
        } catch (Exception e) {
            log.error("Error deleting staff user: {}", id, e);
            return ApiResponse.error("Failed to delete staff user: " + e.getMessage());
        }
    }

    /**
     * Send login credentials email to new staff member
     */
    private void sendCredentialsEmail(User user, String plainPassword) {
        if (emailService == null || !emailService.isEnabled()) {
            log.warn("Email service is not available. Skipping credentials email for user: {}", user.getEmail());
            return;
        }

        try {
            // Prepare email template variables
            Map<String, String> variables = new HashMap<>();
            variables.put("staffName", user.getName());
            variables.put("email", user.getEmail());
            variables.put("password", plainPassword);
            variables.put("loginUrl", frontendUrl + "/login");

            // Load and process email template
            String emailContent = emailTemplateService.buildEmailContent("staff-credentials", variables);

            // Create email request
            EmailRequest emailRequest = EmailRequest.builder()
                    .to(user.getEmail())
                    .subject("Welcome to HOCH - Your Login Credentials")
                    .htmlContent(emailContent)
                    .build();

            // Send email
            emailService.sendEmail(emailRequest);
            log.info("Login credentials email sent successfully to: {}", user.getEmail());
        } catch (Exception e) {
            // Log error but don't fail user creation
            log.error("Failed to send login credentials email to: {}. Error: {}", user.getEmail(), e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<String> resetStaffPassword(Long id, String newPassword) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ApiResponse.error("Staff user not found");
            }

            boolean isStaff = user.getRoles().stream()
                    .anyMatch(role -> role.getName() == Role.RoleName.ROLE_STAFF);
            if (!isStaff) {
                return ApiResponse.error("User is not a staff member");
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            log.info("Password reset by super admin for staff user: {}", user.getEmail());
            return ApiResponse.success("Password updated successfully");
        } catch (Exception e) {
            log.error("Failed to reset staff password: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to reset password: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<String> deleteStaffPermanently(Long id) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ApiResponse.error("Staff user not found");
            }

            boolean isStaff = user.getRoles().stream()
                    .anyMatch(role -> role.getName() == Role.RoleName.ROLE_STAFF);
            if (!isStaff) {
                return ApiResponse.error("User is not a staff member");
            }

            // Work records reference users(id) without a cascade. Deleting underneath them would
            // either fail on the constraint or erase history, so report what blocks it instead.
            List<String> blockers = new ArrayList<>();
            long tasks = countRefs("SELECT COUNT(*) FROM employee_tasks WHERE assigned_to_user_id = ?1", id)
                    + countRefs("SELECT COUNT(*) FROM employee_tasks WHERE assigned_by_user_id = ?1", id);
            if (tasks > 0) blockers.add(tasks + (tasks == 1 ? " task" : " tasks"));

            long designs = countRefs("SELECT COUNT(*) FROM design_phase WHERE staff_assigned_id = ?1", id);
            if (designs > 0) blockers.add(designs + (designs == 1 ? " design phase" : " design phases"));

            long prodTasks = countRefs("SELECT COUNT(*) FROM production_custom_tasks WHERE completed_by_user_id = ?1", id)
                    + countRefs("SELECT COUNT(*) FROM production_custom_tasks WHERE created_by_user_id = ?1", id);
            if (prodTasks > 0) blockers.add(prodTasks + (prodTasks == 1 ? " production task" : " production tasks"));

            long todos = countRefs("SELECT COUNT(*) FROM admin_todos WHERE user_id = ?1", id);
            if (todos > 0) blockers.add(todos + (todos == 1 ? " to-do" : " to-dos"));

            if (!blockers.isEmpty()) {
                return ApiResponse.error(
                        user.getName() + " still owns " + String.join(", ", blockers)
                                + ". Reassign or remove those first, or keep the account deactivated instead.");
            }

            // Sign-in artefacts are disposable and safe to clear.
            entityManager.createNativeQuery("DELETE FROM refresh_tokens WHERE user_id = ?1")
                    .setParameter(1, id).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM password_reset_tokens WHERE user_id = ?1")
                    .setParameter(1, id).executeUpdate();

            String name = user.getName();
            userRepository.delete(user);
            log.info("Staff user permanently deleted by super admin: {} ({})", name, user.getEmail());
            return ApiResponse.success(name + " deleted permanently");
        } catch (Exception e) {
            log.error("Failed to permanently delete staff: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to delete staff: " + e.getMessage());
        }
    }

    private long countRefs(String sql, Long id) {
        try {
            Object result = entityManager.createNativeQuery(sql).setParameter(1, id).getSingleResult();
            return result == null ? 0L : ((Number) result).longValue();
        } catch (Exception e) {
            // A missing table must not block the delete; treat it as "no references".
            log.debug("Reference check skipped for [{}]: {}", sql, e.getMessage());
            return 0L;
        }
    }

    /**
     * Convert User entity to UserDto
     */
    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setActive(user.getActive());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());

        // Convert roles to string set
        Set<String> roleNames = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());
        dto.setRoles(roleNames);

        return dto;
    }
}

