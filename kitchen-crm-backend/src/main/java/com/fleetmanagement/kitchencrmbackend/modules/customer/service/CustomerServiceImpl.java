package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.*;
import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import com.fleetmanagement.kitchencrmbackend.modules.architect.repository.ArchitectRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerPipelineRepository pipelineRepository;

    @Autowired
    private WorkflowHistoryRepository workflowHistoryRepository;

    @Autowired
    private ArchitectRepository architectRepository;

    @Override
    public ApiResponse<Page<CustomerDto>> getAllCustomers(String search, String name, String email,
                                                          Customer.CustomerStatus status,
                                                          Customer.LeadSourceType leadSourceType,
                                                          String address, String kitchenTypes,
                                                          LocalDateTime createdFrom, LocalDateTime createdTo,
                                                          Pageable pageable) {
        Specification<Customer> spec = CustomerSpecifications.withFilters(
                search, name, email, status, leadSourceType, address, kitchenTypes, createdFrom, createdTo);
        Page<Customer> customers = customerRepository.findAll(spec, pageable);
        Page<CustomerDto> customerDtos = customers.map(this::convertToDto);
        return ApiResponse.success(customerDtos);
    }

    @Override
    public ApiResponse<CustomerDto> getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }
        return ApiResponse.success(convertToDto(customer));
    }

    @Override
    public ApiResponse<CustomerDto> createCustomer(CustomerCreateDto customerCreateDto, String createdBy) {
        if (customerCreateDto.getEmail() != null &&
                customerRepository.existsByEmail(customerCreateDto.getEmail())) {
            return ApiResponse.error("Email already exists");
        }

        Customer customer = convertToEntity(customerCreateDto);

        // Lead sources. On create, absent and empty both simply mean "none".
        List<LeadSourceDto> sources = resolveIncomingSources(
                customerCreateDto.getLeadSources(),
                customerCreateDto.getLeadSourceType(),
                customerCreateDto.getArchitectId(),
                customerCreateDto.getReferralName(), customerCreateDto.getReferralContact(),
                customerCreateDto.getReferralLocation(), customerCreateDto.getReferralDesignation(),
                customerCreateDto.getReferralFirm(), customerCreateDto.getReferralEmail(),
                customerCreateDto.getManualLeadName(), customerCreateDto.getManualLeadContact());
        try {
            applyLeadSources(customer, sources != null ? sources : List.of());
        } catch (LeadSourceException e) {
            return ApiResponse.error(e.getMessage());
        }

        Customer savedCustomer = customerRepository.save(customer);

        // Create initial pipeline entry
        CustomerPipeline pipeline = new CustomerPipeline();
        pipeline.setCustomer(savedCustomer);
        pipelineRepository.save(pipeline);

        // Create workflow history entry
        WorkflowHistory history = new WorkflowHistory();
        history.setCustomer(savedCustomer);
        history.setPreviousState(null);
        history.setNewState(savedCustomer.getStatus().name());
        history.setChangedBy(createdBy);
        history.setChangeReason("Customer created");
        history.setTimestamp(LocalDateTime.now());
        workflowHistoryRepository.save(history);

        return ApiResponse.success("Customer created successfully", convertToDto(savedCustomer));
    }

    @Override
    public ApiResponse<CustomerDto> updateCustomer(Long id, CustomerDto customerDto, String updatedBy) {
        Customer existingCustomer = customerRepository.findById(id).orElse(null);
        if (existingCustomer == null) {
            return ApiResponse.error("Customer not found");
        }

        // Check email uniqueness
        if (customerDto.getEmail() != null &&
                !existingCustomer.getEmail().equals(customerDto.getEmail()) &&
                customerRepository.existsByEmail(customerDto.getEmail())) {
            return ApiResponse.error("Email already exists");
        }

        existingCustomer.setName(customerDto.getName());
        existingCustomer.setContact(customerDto.getContact());
        existingCustomer.setEmail(customerDto.getEmail());
        existingCustomer.setAddress(customerDto.getAddress());
        existingCustomer.setKitchenTypes(customerDto.getKitchenTypes());
        existingCustomer.setSqft(customerDto.getSqft());
        existingCustomer.setPlace(customerDto.getPlace());
        existingCustomer.setContactPerson(customerDto.getContactPerson());
        existingCustomer.setFollowUpNotes(customerDto.getFollowUpNotes());

        // Lead sources: null means "not specified, leave them alone"; a list (including an
        // empty one) replaces them wholesale.
        List<LeadSourceDto> sources = resolveIncomingSources(
                customerDto.getLeadSources(),
                customerDto.getLeadSourceType(),
                customerDto.getArchitectId(),
                customerDto.getReferralName(), customerDto.getReferralContact(),
                customerDto.getReferralLocation(), customerDto.getReferralDesignation(),
                customerDto.getReferralFirm(), customerDto.getReferralEmail(),
                customerDto.getManualLeadName(), customerDto.getManualLeadContact());
        if (sources != null) {
            try {
                applyLeadSources(existingCustomer, sources);
            } catch (LeadSourceException e) {
                return ApiResponse.error(e.getMessage());
            }
        }

        Customer updatedCustomer = customerRepository.save(existingCustomer);

        // Create workflow history entry
        WorkflowHistory history = new WorkflowHistory();
        history.setCustomer(updatedCustomer);
        history.setPreviousState("Customer Update");
        history.setNewState("Customer Updated");
        history.setChangedBy(updatedBy);
        history.setChangeReason("Customer information updated");
        history.setTimestamp(LocalDateTime.now());
        workflowHistoryRepository.save(history);

        return ApiResponse.success("Customer updated successfully", convertToDto(updatedCustomer));
    }

    @Override
    public ApiResponse<String> deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }

        customerRepository.delete(customer);
        return ApiResponse.success("Customer deleted successfully");
    }

    @Override
    public ApiResponse<String> updateCustomerStatus(Long id, Customer.CustomerStatus newStatus,
                                                    String changedBy, String reason) {
        Customer customer = customerRepository.findById(id).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }

        String previousStatus = customer.getStatus().name();
        customer.setStatus(newStatus);
        customerRepository.save(customer);

        // Create workflow history entry
        WorkflowHistory history = new WorkflowHistory();
        history.setCustomer(customer);
        history.setPreviousState(previousStatus);
        history.setNewState(newStatus.name());
        history.setChangedBy(changedBy);
        history.setChangeReason(reason != null ? reason : "Status updated");
        history.setTimestamp(LocalDateTime.now());
        workflowHistoryRepository.save(history);

        return ApiResponse.success("Customer status updated successfully");
    }

    @Override
    public ApiResponse<Map<String, Long>> getCustomerStatistics() {
        Map<String, Long> stats = new HashMap<>();

        for (Customer.CustomerStatus status : Customer.CustomerStatus.values()) {
            Long count = customerRepository.countByStatus(status);
            stats.put(status.name().toLowerCase(), count);
        }

        stats.put("total", customerRepository.count());

        return ApiResponse.success(stats);
    }

    private CustomerDto convertToDto(Customer customer) {
        CustomerDto dto = new CustomerDto();
        dto.setId(customer.getId());
        dto.setName(customer.getName());
        dto.setContact(customer.getContact());
        dto.setEmail(customer.getEmail());
        dto.setAddress(customer.getAddress());
        dto.setKitchenTypes(customer.getKitchenTypes());
        dto.setSqft(customer.getSqft());
        dto.setPlace(customer.getPlace());
        dto.setContactPerson(customer.getContactPerson());
        dto.setFollowUpNotes(customer.getFollowUpNotes());
        dto.setStatus(customer.getStatus());
        dto.setCreatedAt(customer.getCreatedAt());
        dto.setUpdatedAt(customer.getUpdatedAt());
        
        dto.setLeadSources(customer.getLeadSources().stream().map(this::toLeadSourceDto).toList());

        // Legacy flat fields, still emitted so an older cached bundle keeps rendering.
        if (customer.getArchitect() != null) {
            dto.setArchitectId(customer.getArchitect().getId());
            dto.setArchitectName(customer.getArchitect().getArchitectureName());
        }
        dto.setLeadSourceType(customer.getLeadSourceType());
        dto.setManualLeadName(customer.getManualLeadName());
        dto.setManualLeadContact(customer.getManualLeadContact());
        dto.setReferralName(customer.getReferralName());
        dto.setReferralContact(customer.getReferralContact());
        dto.setReferralLocation(customer.getReferralLocation());
        dto.setReferralDesignation(customer.getReferralDesignation());
        dto.setReferralFirm(customer.getReferralFirm());
        dto.setReferralEmail(customer.getReferralEmail());

        return dto;
    }

    /** Thrown when an incoming lead source references an architect that does not exist. */
    private static class LeadSourceException extends RuntimeException {
        LeadSourceException(String message) {
            super(message);
        }
    }

    /**
     * Replaces the customer's lead sources with exactly {@code incoming}.
     *
     * <p>Follows the same replace-children idiom as ApplianceCustomerServiceImpl.applyDto:
     * clear the existing collection in place (orphanRemoval deletes the rows) and re-add, with
     * sortOrder taken from list position. Never reassign the list — that breaks orphanRemoval.
     */
    private void applyLeadSources(Customer customer, List<LeadSourceDto> incoming) {
        customer.clearLeadSources();

        int order = 0;
        for (LeadSourceDto dto : incoming) {
            Customer.LeadSourceType type = dto.getSourceType();
            // NONE is never persisted — an empty list is how "no lead source" is represented.
            if (type == null || type == Customer.LeadSourceType.NONE) {
                continue;
            }

            CustomerLeadSource source = new CustomerLeadSource();
            source.setSourceType(type);

            if (type.isLinked() && dto.getArchitectId() != null) {
                Architect architect = architectRepository.findById(dto.getArchitectId())
                        .orElseThrow(() -> new LeadSourceException(
                                "Architect not found: " + dto.getArchitectId()));
                source.setArchitect(architect);
                // Firm/phone live on the architects row; they are not duplicated here.
            } else {
                // Free-text types, and linked types that have no record yet: keep whatever text
                // came in. Without this, opening a legacy architect-sourced customer and saving
                // an unrelated field would silently wipe the referrer's name and number.
                source.setReferralName(trimToNull(dto.getReferralName()));
                source.setReferralContact(trimToNull(dto.getReferralContact()));
                source.setReferralLocation(trimToNull(dto.getReferralLocation()));
                source.setReferralDesignation(trimToNull(dto.getReferralDesignation()));
                source.setReferralFirm(trimToNull(dto.getReferralFirm()));
                source.setReferralEmail(trimToNull(dto.getReferralEmail()));
            }

            source.setSortOrder(order++);
            customer.addLeadSource(source);
        }

        applyLegacyLeadSourceMirror(customer);
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * Decides what an incoming payload means for the lead-source collection.
     *
     * <p>Returns {@code null} for "not specified — leave them alone", or a list to replace them
     * with (an empty list clears them). This removes the old guesswork where a customer whose
     * only source had no details could never be changed through a partial update.
     *
     * <p>When {@code leadSources} is absent but the legacy flat fields are present, they are
     * folded into a single-element list so a cached older frontend bundle still saves correctly.
     */
    private List<LeadSourceDto> resolveIncomingSources(List<LeadSourceDto> leadSources,
                                                       Customer.LeadSourceType legacyType,
                                                       Long legacyArchitectId,
                                                       String referralName, String referralContact,
                                                       String referralLocation, String referralDesignation,
                                                       String referralFirm, String referralEmail,
                                                       String manualLeadName, String manualLeadContact) {
        if (leadSources != null) {
            return leadSources;
        }

        boolean legacyProvided = legacyType != null
                || legacyArchitectId != null
                || StringUtils.hasText(manualLeadName)
                || StringUtils.hasText(referralName);
        if (!legacyProvided) {
            return null;
        }

        Customer.LeadSourceType type = legacyType;
        if (type == null) {
            if (legacyArchitectId != null) {
                type = Customer.LeadSourceType.ARCHITECT;
            } else if (StringUtils.hasText(manualLeadName)) {
                type = Customer.LeadSourceType.MANUAL_REFERRAL;
                if (referralName == null) referralName = manualLeadName;
                if (referralContact == null) referralContact = manualLeadContact;
            } else {
                type = Customer.LeadSourceType.NONE;
            }
        }
        if (type == Customer.LeadSourceType.NONE) {
            return List.of();
        }
        if (type == Customer.LeadSourceType.MANUAL) {
            type = Customer.LeadSourceType.MANUAL_REFERRAL;
            if (referralName == null) referralName = manualLeadName;
            if (referralContact == null) referralContact = manualLeadContact;
        }

        LeadSourceDto dto = new LeadSourceDto();
        dto.setSourceType(type);
        dto.setArchitectId(legacyArchitectId);
        dto.setReferralName(referralName);
        dto.setReferralContact(referralContact);
        dto.setReferralLocation(referralLocation);
        dto.setReferralDesignation(referralDesignation);
        dto.setReferralFirm(referralFirm);
        dto.setReferralEmail(referralEmail);
        return List.of(dto);
    }

    /**
     * Mirrors the first lead source back into the legacy flat columns for one release, so that
     * rolling back to the previous jar still renders correct data. Deleted together with those
     * columns in a later release.
     */
    private void applyLegacyLeadSourceMirror(Customer customer) {
        CustomerLeadSource first = customer.getLeadSources().isEmpty()
                ? null
                : customer.getLeadSources().get(0);

        customer.setArchitect(null);
        customer.setManualLeadName(null);
        customer.setManualLeadContact(null);
        customer.setReferralName(null);
        customer.setReferralContact(null);
        customer.setReferralLocation(null);
        customer.setReferralDesignation(null);
        customer.setReferralFirm(null);
        customer.setReferralEmail(null);

        if (first == null) {
            customer.setLeadSourceType(Customer.LeadSourceType.NONE);
            return;
        }

        // The previous jar's enum has no BUILDER constant, so write the value it understands.
        customer.setLeadSourceType(first.getSourceType() == Customer.LeadSourceType.BUILDER
                ? Customer.LeadSourceType.BUILDER_REFERRAL
                : first.getSourceType());
        customer.setArchitect(first.getArchitect());

        if (first.getArchitect() != null) {
            Architect a = first.getArchitect();
            customer.setReferralName(a.getArchitectureName());
            customer.setReferralFirm(a.getFirm());
            customer.setReferralContact(a.getContactNumber());
        } else {
            customer.setReferralName(first.getReferralName());
            customer.setReferralContact(first.getReferralContact());
            customer.setReferralLocation(first.getReferralLocation());
            customer.setReferralDesignation(first.getReferralDesignation());
            customer.setReferralFirm(first.getReferralFirm());
            customer.setReferralEmail(first.getReferralEmail());
        }
    }

    private LeadSourceDto toLeadSourceDto(CustomerLeadSource source) {
        LeadSourceDto dto = new LeadSourceDto();
        dto.setId(source.getId());
        dto.setSourceType(source.getSourceType());
        dto.setSortOrder(source.getSortOrder());

        Architect architect = source.getArchitect();
        if (architect != null) {
            dto.setArchitectId(architect.getId());
            dto.setArchitectName(architect.getArchitectureName());
            dto.setArchitectFirm(architect.getFirm());
            dto.setArchitectContact(architect.getContactNumber());
            dto.setArchitectPartnerType(architect.getPartnerType());
        }

        dto.setReferralName(source.getReferralName());
        dto.setReferralContact(source.getReferralContact());
        dto.setReferralLocation(source.getReferralLocation());
        dto.setReferralDesignation(source.getReferralDesignation());
        dto.setReferralFirm(source.getReferralFirm());
        dto.setReferralEmail(source.getReferralEmail());
        return dto;
    }

    private Customer convertToEntity(CustomerCreateDto dto) {
        Customer customer = new Customer();
        customer.setName(dto.getName());
        customer.setContact(dto.getContact());
        customer.setEmail(dto.getEmail());
        customer.setAddress(dto.getAddress());
        customer.setKitchenTypes(dto.getKitchenTypes());
        customer.setSqft(dto.getSqft());
        customer.setPlace(dto.getPlace());
        customer.setContactPerson(dto.getContactPerson());
        customer.setFollowUpNotes(dto.getFollowUpNotes());
        customer.setStatus(dto.getStatus() != null ? dto.getStatus() : Customer.CustomerStatus.LEAD);
        return customer;
    }
}