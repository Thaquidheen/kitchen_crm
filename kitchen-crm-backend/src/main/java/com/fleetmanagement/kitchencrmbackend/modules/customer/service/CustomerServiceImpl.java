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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

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

        customer.setLeadSourceType(customerCreateDto.getLeadSourceType() != null
                ? customerCreateDto.getLeadSourceType()
                : Customer.LeadSourceType.NONE);

        // Project network. On create, absent and empty both simply mean "nobody".
        List<ProjectNetworkMemberDto> members = resolveIncomingNetwork(
                customerCreateDto.getProjectNetwork(),
                customerCreateDto.getLeadSources(),
                customerCreateDto.getArchitectId(),
                customerCreateDto.getReferralName(), customerCreateDto.getReferralContact(),
                customerCreateDto.getReferralLocation(), customerCreateDto.getReferralDesignation(),
                customerCreateDto.getReferralFirm(), customerCreateDto.getReferralEmail(),
                customerCreateDto.getManualLeadName(), customerCreateDto.getManualLeadContact());
        try {
            applyProjectNetwork(customer, members != null ? members : List.of());
        } catch (ProjectNetworkException e) {
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

        // Check email uniqueness. Objects.equals, not existingCustomer.getEmail().equals(...):
        // email is optional, so the stored value is routinely null, and dereferencing it threw an
        // NPE (HTTP 500) on every attempt to add an email to a customer that did not have one.
        if (customerDto.getEmail() != null &&
                !Objects.equals(existingCustomer.getEmail(), customerDto.getEmail()) &&
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

        // Explicit, and easy to forget: without this the form's Lead source would appear to save
        // and silently not, the way status still does (status is changed through
        // updateCustomerStatus instead, which records the note and the history entry).
        if (customerDto.getLeadSourceType() != null) {
            existingCustomer.setLeadSourceType(customerDto.getLeadSourceType());
        }

        // Project network: null means "not specified, leave it alone"; a list (including an
        // empty one) replaces it wholesale.
        List<ProjectNetworkMemberDto> members = resolveIncomingNetwork(
                customerDto.getProjectNetwork(),
                customerDto.getLeadSources(),
                customerDto.getArchitectId(),
                customerDto.getReferralName(), customerDto.getReferralContact(),
                customerDto.getReferralLocation(), customerDto.getReferralDesignation(),
                customerDto.getReferralFirm(), customerDto.getReferralEmail(),
                customerDto.getManualLeadName(), customerDto.getManualLeadContact());
        if (members != null) {
            try {
                applyProjectNetwork(existingCustomer, members);
            } catch (ProjectNetworkException e) {
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
        
        // A null memberType means the row holds a pre-V95 channel value the converter cannot map
        // to a person. V95 deletes those, so this only guards a database written by an older jar
        // after the migration — dropping the row beats rendering a blank entry the form then
        // refuses to save.
        List<ProjectNetworkMemberDto> network = customer.getProjectNetwork().stream()
                .filter(m -> m.getMemberType() != null)
                .map(this::toMemberDto)
                .toList();
        dto.setProjectNetwork(network);
        dto.setLeadSourceType(customer.getLeadSourceType());

        // Legacy fields, still emitted so an older cached bundle keeps rendering.
        dto.setLeadSources(network);
        if (customer.getArchitect() != null) {
            dto.setArchitectId(customer.getArchitect().getId());
            dto.setArchitectName(customer.getArchitect().getArchitectureName());
        }
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

    /** Thrown when an incoming network member references an architect that does not exist. */
    private static class ProjectNetworkException extends RuntimeException {
        ProjectNetworkException(String message) {
            super(message);
        }
    }

    /**
     * Replaces the customer's project network with exactly {@code incoming}.
     *
     * <p>Follows the same replace-children idiom as ApplianceCustomerServiceImpl.applyDto:
     * clear the existing collection in place (orphanRemoval deletes the rows) and re-add, with
     * sortOrder taken from list position. Never reassign the list — that breaks orphanRemoval.
     */
    private void applyProjectNetwork(Customer customer, List<ProjectNetworkMemberDto> incoming) {
        // Build and fully validate the replacement list BEFORE touching the customer. The old
        // order — clear first, resolve architects inside the loop — meant an unknown architect id
        // threw half-way through, and because the caller catches that and returns an error
        // response rather than rethrowing, this @Transactional method returned normally and
        // COMMITTED: orphanRemoval had already deleted every existing row. The user saw "save
        // failed" while their project network was destroyed.
        List<CustomerProjectNetworkMember> replacement = new ArrayList<>();

        for (ProjectNetworkMemberDto dto : incoming) {
            CustomerProjectNetworkMember.MemberType type = dto.effectiveType();
            // Null covers both a blank row and a stale bundle sending a channel value that is
            // no longer a person; either way there is nobody to record.
            if (type == null) {
                continue;
            }

            CustomerProjectNetworkMember member = new CustomerProjectNetworkMember();

            if (type.isLinked() && dto.getArchitectId() != null) {
                Architect architect = architectRepository.findById(dto.getArchitectId())
                        .orElseThrow(() -> new ProjectNetworkException(
                                "Architect not found: " + dto.getArchitectId()));
                member.setMemberType(type);
                member.setArchitect(architect);
                // Firm/phone live on the architects row; they are not duplicated here.
            } else {
                // A linked type with no record behind it is a shape nothing can render or save,
                // so it becomes a referral, which keeps the text and is a valid row. Without
                // keeping the text, opening a legacy architect-sourced customer and saving an
                // unrelated field would silently wipe the referrer's name and number.
                member.setMemberType(CustomerProjectNetworkMember.MemberType.REFERRAL);
                member.setReferralName(trimToNull(dto.getReferralName()));
                member.setReferralContact(trimToNull(dto.getReferralContact()));
                member.setReferralLocation(trimToNull(dto.getReferralLocation()));
                member.setReferralDesignation(trimToNull(dto.getReferralDesignation()));
                member.setReferralFirm(trimToNull(dto.getReferralFirm()));
                member.setReferralEmail(trimToNull(dto.getReferralEmail()));
            }

            member.setSortOrder(replacement.size());
            replacement.add(member);
        }

        // Nothing below can fail, so the collection is only ever cleared on a path that commits
        // the full replacement. Clear in place — reassigning the list breaks orphanRemoval.
        customer.clearProjectNetwork();
        replacement.forEach(customer::addProjectNetworkMember);
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * Decides what an incoming payload means for the project network.
     *
     * <p>Returns {@code null} for "not specified — leave it alone", or a list to replace it with
     * (an empty list clears it).
     *
     * <p>The two fallbacks exist only so a cached older frontend bundle still saves across a
     * deploy: {@code leadSources} was this field's name before V95, and before V92 the referrer
     * was a handful of flat columns, which fold into a single REFERRAL member.
     */
    private List<ProjectNetworkMemberDto> resolveIncomingNetwork(
            List<ProjectNetworkMemberDto> projectNetwork,
            List<ProjectNetworkMemberDto> legacyLeadSources,
            Long legacyArchitectId,
            String referralName, String referralContact,
            String referralLocation, String referralDesignation,
            String referralFirm, String referralEmail,
            String manualLeadName, String manualLeadContact) {
        if (projectNetwork != null) {
            return projectNetwork;
        }
        if (legacyLeadSources != null) {
            return legacyLeadSources;
        }

        if (legacyArchitectId == null
                && !StringUtils.hasText(manualLeadName)
                && !StringUtils.hasText(referralName)) {
            return null;
        }

        ProjectNetworkMemberDto dto = new ProjectNetworkMemberDto();
        if (legacyArchitectId != null) {
            dto.setMemberType(CustomerProjectNetworkMember.MemberType.ARCHITECT);
            dto.setArchitectId(legacyArchitectId);
        } else {
            dto.setMemberType(CustomerProjectNetworkMember.MemberType.REFERRAL);
        }
        dto.setReferralName(StringUtils.hasText(referralName) ? referralName : manualLeadName);
        dto.setReferralContact(StringUtils.hasText(referralContact) ? referralContact : manualLeadContact);
        dto.setReferralLocation(referralLocation);
        dto.setReferralDesignation(referralDesignation);
        dto.setReferralFirm(referralFirm);
        dto.setReferralEmail(referralEmail);
        return List.of(dto);
    }

    private ProjectNetworkMemberDto toMemberDto(CustomerProjectNetworkMember member) {
        ProjectNetworkMemberDto dto = new ProjectNetworkMemberDto();
        dto.setId(member.getId());
        dto.setMemberType(member.getMemberType());
        // Legacy name, emitted so an older cached bundle still renders the entry.
        dto.setSourceType(member.getMemberType() != null ? member.getMemberType().name() : null);
        dto.setSortOrder(member.getSortOrder());

        Architect architect = member.getArchitect();
        if (architect != null) {
            dto.setArchitectId(architect.getId());
            dto.setArchitectName(architect.getArchitectureName());
            dto.setArchitectFirm(architect.getFirm());
            dto.setArchitectContact(architect.getContactNumber());
            dto.setArchitectPartnerType(architect.getPartnerType());
        }

        dto.setReferralName(member.getReferralName());
        dto.setReferralContact(member.getReferralContact());
        dto.setReferralLocation(member.getReferralLocation());
        dto.setReferralDesignation(member.getReferralDesignation());
        dto.setReferralFirm(member.getReferralFirm());
        dto.setReferralEmail(member.getReferralEmail());
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