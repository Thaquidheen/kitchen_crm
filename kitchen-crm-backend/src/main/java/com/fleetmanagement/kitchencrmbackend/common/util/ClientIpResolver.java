package com.fleetmanagement.kitchencrmbackend.common.util;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Resolves the caller's IP behind our nginx, for audit rows and session records.
 *
 * The header choice is a security decision, not a preference. nginx/nginx.conf sets:
 *   proxy_set_header X-Real-IP        $remote_addr;              -- overwrites, single-valued
 *   proxy_set_header X-Forwarded-For  $proxy_add_x_forwarded_for; -- APPENDS to the client's value
 *
 * So X-Real-IP is always the socket peer as nginx saw it and cannot be influenced by the caller,
 * while X-Forwarded-For's *first* hop is whatever the client chose to send: a request carrying
 * "X-Forwarded-For: 8.8.8.8" would otherwise be recorded as coming from 8.8.8.8, making the audit
 * trail's IP column worthless exactly when it matters (failed sign-ins).
 *
 * Order therefore: X-Real-IP, else the LAST hop of X-Forwarded-For (the entry nginx appended, not
 * the one the client supplied), else the socket address.
 */
public final class ClientIpResolver {

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String realIp = header(request, "X-Real-IP");
        if (realIp != null) {
            return realIp;
        }
        String xff = header(request, "X-Forwarded-For");
        if (xff != null) {
            String[] hops = xff.split(",");
            for (int i = hops.length - 1; i >= 0; i--) {
                String hop = hops[i].trim();
                if (!hop.isEmpty()) {
                    return hop;
                }
            }
        }
        return request.getRemoteAddr();
    }

    private static String header(HttpServletRequest request, String name) {
        String v = request.getHeader(name);
        if (v == null) {
            return null;
        }
        v = v.trim();
        return v.isEmpty() || "unknown".equalsIgnoreCase(v) ? null : v;
    }
}
