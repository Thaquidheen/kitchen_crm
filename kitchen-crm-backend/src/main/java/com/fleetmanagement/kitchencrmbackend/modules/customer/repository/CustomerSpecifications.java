package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerProjectNetworkMember;
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

                // The project network lives in a child table. Searching it also has to cover the
                // linked architect/builder's own name and firm — a linked member stores no free
                // text, so without this an architect's customer would stop being findable by
                // that architect's name.
                Subquery<Integer> sq = query.subquery(Integer.class);
                Root<CustomerProjectNetworkMember> pn = sq.from(CustomerProjectNetworkMember.class);
                Join<CustomerProjectNetworkMember, Architect> arch = pn.join("architect", JoinType.LEFT);
                sq.select(cb.literal(1));

                List<Predicate> memberOrs = new ArrayList<>();
                for (String field : SEARCHABLE_SOURCE_FIELDS) {
                    memberOrs.add(cb.like(cb.lower(pn.<String>get(field)), like));
                }
                memberOrs.add(cb.like(cb.lower(arch.<String>get("architectureName")), like));
                memberOrs.add(cb.like(cb.lower(arch.<String>get("firm")), like));

                sq.where(cb.and(
                        cb.equal(pn.get("customer"), root),
                        cb.or(memberOrs.toArray(new Predicate[0]))));
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
                // Since V95 the lead source is a single value on the customer again, so this is a
                // plain column match rather than a subquery over the child table.
                if (leadSourceType == Customer.LeadSourceType.NONE) {
                    // Rows predating the column's default still hold NULL; "No Lead" covers both.
                    predicates.add(cb.or(
                            cb.isNull(root.get("leadSourceType")),
                            cb.equal(root.get("leadSourceType"), Customer.LeadSourceType.NONE)));
                } else {
                    predicates.add(cb.equal(root.get("leadSourceType"), leadSourceType));
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
