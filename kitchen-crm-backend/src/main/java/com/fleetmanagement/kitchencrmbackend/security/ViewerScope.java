package com.fleetmanagement.kitchencrmbackend.security;

/**
 * Who is allowed to see a creator-owned row (reminders, notes, follow-ups).
 *
 * <p>Collapses "is this a super admin?" and "is the admin filtering by one staff member?" into a
 * single value that every repository query takes, so no read path can accidentally be left
 * unscoped: {@link #ALL} means no restriction, any other value means "only rows created by that
 * user id".
 *
 * <p>A sentinel rather than {@code null} on purpose — CustomerReminderRepository deliberately
 * avoids {@code :param IS NULL} in its JPQL, and one convention across all of these queries is
 * safer than two.
 *
 * <p>Legacy rows whose creator could not be resolved keep a NULL {@code created_by_user_id}, so
 * they never equal a real user id and stay super-admin-only. That is intentional: a row whose
 * owner is unknown must not be handed to a guess.
 */
public final class ViewerScope {

    /** No restriction — used for a super admin who is not filtering by staff. */
    public static final long ALL = -1L;

    private ViewerScope() {
    }

    public static boolean isSuperAdmin(UserPrincipal user) {
        return user != null && user.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()));
    }

    /**
     * The scope to apply for this caller.
     *
     * @param user            the caller; a missing principal is treated as the most restrictive case
     * @param createdByFilter optional "show me only this staff member's rows"; honoured for a super
     *                        admin and ignored for everyone else, so it cannot be used to read
     *                        somebody else's rows
     */
    public static long of(UserPrincipal user, Long createdByFilter) {
        if (isSuperAdmin(user)) {
            return createdByFilter != null ? createdByFilter : ALL;
        }
        // Staff always see exactly their own. A null principal would otherwise mean ALL.
        return user != null && user.getId() != null ? user.getId() : Long.MIN_VALUE;
    }

    /** Scope for a caller with no staff filter available (single-row reads, per-entity lists). */
    public static long of(UserPrincipal user) {
        return of(user, null);
    }

    /** True when this caller may read/modify a row created by {@code ownerId}. */
    public static boolean canAccess(UserPrincipal user, Long ownerId) {
        if (isSuperAdmin(user)) {
            return true;
        }
        return user != null && user.getId() != null && user.getId().equals(ownerId);
    }
}
