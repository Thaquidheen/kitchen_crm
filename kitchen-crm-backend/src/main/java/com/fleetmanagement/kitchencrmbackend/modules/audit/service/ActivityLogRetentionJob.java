package com.fleetmanagement.kitchencrmbackend.modules.audit.service;

import com.fleetmanagement.kitchencrmbackend.modules.audit.entity.ActivityLog;
import com.fleetmanagement.kitchencrmbackend.modules.audit.repository.ActivityLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Bounds the activity log. It records every sign-in attempt and every write request in the app,
 * and /auth/signin is unauthenticated and unthrottled — a scanner hammering it (this host has
 * already logged thousands of failed SSH attempts) would otherwise grow the table without limit.
 *
 * Two windows, because the rows are not worth the same: a failed sign-in matters while you are
 * investigating it, whereas "who changed this quotation" is worth keeping for a season. Runs at
 * 02:30, after the existing 02:00 refresh-token cleanup, so the two never overlap.
 */
@Component
public class ActivityLogRetentionJob {

    private static final Logger logger = LoggerFactory.getLogger(ActivityLogRetentionJob.class);

    private static final int FAILED_LOGIN_RETENTION_DAYS = 30;
    private static final int RETENTION_DAYS = 180;

    /** Rows are stamped in the business timezone, so the cutoffs must be measured from it too. */
    @Value("${app.business-timezone:Asia/Kolkata}")
    private String businessTimezone;

    @Autowired
    private ActivityLogRepository repository;

    // 02:30 in the business timezone, not the container's UTC — otherwise this "nightly" job runs
    // at 08:00 local, in the middle of the working day.
    @Scheduled(cron = "0 30 2 * * ?", zone = "${app.business-timezone:Asia/Kolkata}")
    @Transactional
    public void purgeOldEntries() {
        try {
            LocalDateTime now = LocalDateTime.now(ZoneId.of(businessTimezone));
            int failed = repository.deleteByEventTypeOlderThan(
                    ActivityLog.EventType.LOGIN_FAILED, now.minusDays(FAILED_LOGIN_RETENTION_DAYS));
            int old = repository.deleteOlderThan(now.minusDays(RETENTION_DAYS));
            if (failed + old > 0) {
                logger.info("Activity log purge: {} failed sign-in row(s) beyond {}d, {} row(s) beyond {}d",
                        failed, FAILED_LOGIN_RETENTION_DAYS, old, RETENTION_DAYS);
            }
        } catch (Exception e) {
            // A failed purge must not take down the scheduler that also drives reminders.
            logger.warn("Activity log purge failed: {}", e.getMessage());
        }
    }
}
