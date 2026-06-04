package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Dynamic, composable filters for the customer list. Builds a single ANDed
 * predicate from whichever filter params are present; absent params are ignored.
 */
public final class CustomerSpecifications {

    private CustomerSpecifications() {
    }

    /** Text fields covered by the free-text "global search" (all Customer columns, no joins). */
    private static final String[] SEARCHABLE_FIELDS = {
            "name", "email", "contact", "address", "kitchenTypes",
            "referralName", "referralContact", "referralLocation", "referralDesignation"
    };

    public static Specification<Customer> withFilters(
            String search,
            String name,
            String email,
            Customer.CustomerStatus status,
            Customer.LeadSourceType leadSourceType,
            String address,
            String kitchenTypes,
            LocalDateTime createdFrom,
            LocalDateTime createdTo) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String like = "%" + search.trim().toLowerCase() + "%";
                List<Predicate> ors = new ArrayList<>();
                for (String field : SEARCHABLE_FIELDS) {
                    ors.add(cb.like(cb.lower(root.<String>get(field)), like));
                }
                predicates.add(cb.or(ors.toArray(new Predicate[0])));
            }

            // Back-compat: dedicated name/email filters still work alongside global search.
            if (StringUtils.hasText(name)) {
                predicates.add(cb.like(cb.lower(root.<String>get("name")),
                        "%" + name.trim().toLowerCase() + "%"));
            }
            if (StringUtils.hasText(email)) {
                predicates.add(cb.like(cb.lower(root.<String>get("email")),
                        "%" + email.trim().toLowerCase() + "%"));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (leadSourceType != null) {
                predicates.add(cb.equal(root.get("leadSourceType"), leadSourceType));
            }
            if (StringUtils.hasText(address)) {
                predicates.add(cb.like(cb.lower(root.<String>get("address")),
                        "%" + address.trim().toLowerCase() + "%"));
            }
            if (StringUtils.hasText(kitchenTypes)) {
                predicates.add(cb.like(cb.lower(root.<String>get("kitchenTypes")),
                        "%" + kitchenTypes.trim().toLowerCase() + "%"));
            }
            if (createdFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get("createdAt"), createdFrom));
            }
            if (createdTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<LocalDateTime>get("createdAt"), createdTo));
            }

            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
