package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerLeadSource;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Dynamic, composable filters for the customer list. Builds a single ANDed
 * predicate from whichever filter params are present; absent params are ignored.
 *
 * <p>Lead-source predicates use correlated EXISTS subqueries rather than joins. Spring Data
 * runs this same specification against a count query to produce {@code totalElements}; a join
 * would fan one customer out into one row per lead source, inflating that count and shifting
 * page boundaries. EXISTS yields exactly one row per customer and needs no {@code distinct}.
 */
public final class CustomerSpecifications {

    private CustomerSpecifications() {
    }

    /** Columns on Customer itself covered by the free-text "global search". */
    private static final String[] SEARCHABLE_FIELDS = {
            "name", "email", "contact", "address", "kitchenTypes"
    };

    /** Free-text columns on the lead-source child rows, also covered by global search. */
    private static final String[] SEARCHABLE_SOURCE_FIELDS = {
            "referralName", "referralContact", "referralLocation",
            "referralDesignation", "referralFirm", "referralEmail"
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

                // Lead-source details now live in a child table. Searching them also has to
                // cover the linked architect/builder's own name and firm — a linked source
                // stores no free text, so without this an architect-sourced customer would
                // stop being findable by that architect's name.
                Subquery<Integer> sq = query.subquery(Integer.class);
                Root<CustomerLeadSource> ls = sq.from(CustomerLeadSource.class);
                Join<CustomerLeadSource, Architect> arch = ls.join("architect", JoinType.LEFT);
                sq.select(cb.literal(1));

                List<Predicate> sourceOrs = new ArrayList<>();
                for (String field : SEARCHABLE_SOURCE_FIELDS) {
                    sourceOrs.add(cb.like(cb.lower(ls.<String>get(field)), like));
                }
                sourceOrs.add(cb.like(cb.lower(arch.<String>get("architectureName")), like));
                sourceOrs.add(cb.like(cb.lower(arch.<String>get("firm")), like));

                sq.where(cb.and(
                        cb.equal(ls.get("customer"), root),
                        cb.or(sourceOrs.toArray(new Predicate[0]))));
                ors.add(cb.exists(sq));

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
                Subquery<Integer> sq = query.subquery(Integer.class);
                Root<CustomerLeadSource> ls = sq.from(CustomerLeadSource.class);
                sq.select(cb.literal(1));

                if (leadSourceType == Customer.LeadSourceType.NONE) {
                    // NONE is never stored as a row, so "No Lead" means "has no sources at all".
                    sq.where(cb.equal(ls.get("customer"), root));
                    predicates.add(cb.not(cb.exists(sq)));
                } else {
                    // Match if ANY of the customer's sources is of this type.
                    sq.where(cb.and(
                            cb.equal(ls.get("customer"), root),
                            cb.equal(ls.get("sourceType"), leadSourceType)));
                    predicates.add(cb.exists(sq));
                }
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
