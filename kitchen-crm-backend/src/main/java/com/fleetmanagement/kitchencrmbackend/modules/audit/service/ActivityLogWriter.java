package com.fleetmanagement.kitchencrmbackend.modules.audit.service;

import com.fleetmanagement.kitchencrmbackend.modules.audit.entity.ActivityLog;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Drains audit rows to the database on a single background thread.
 *
 * Auditing observes every sign-in and every write request in the app, so it must be incapable of
 * slowing one down or breaking one. Two properties give that guarantee:
 *
 *  - {@link #submit} only offers to a bounded queue. It never touches a connection, never waits on
 *    the pool, and never blocks — so an unreachable or slow database costs the request nothing.
 *    Under sustained overload the oldest queued rows are dropped (and counted) rather than the
 *    request thread being held up; losing audit rows is strictly better than stalling logins.
 *  - The insert runs here, off the request thread, with the try/catch wrapping the whole
 *    transactional proxy call. Begin- and commit-time failures are therefore caught, which a
 *    try/catch inside an @Transactional method cannot do.
 */
@Component
public class ActivityLogWriter {

    private static final Logger logger = LoggerFactory.getLogger(ActivityLogWriter.class);

    /** Roughly a minute of very heavy write traffic; beyond this the DB is the problem, not the queue. */
    private static final int QUEUE_CAPACITY = 1000;
    private static final long SHUTDOWN_DRAIN_MS = 3000;

    private final BlockingQueue<ActivityLog> queue = new ArrayBlockingQueue<>(QUEUE_CAPACITY);
    private final AtomicLong dropped = new AtomicLong();
    private volatile boolean running = true;
    private Thread worker;

    @Autowired
    private ActivityLogTxWriter txWriter;

    /** Never throws, never blocks. Returns silently if the row cannot be queued. */
    public void submit(ActivityLog log) {
        try {
            if (!queue.offer(log)) {
                long n = dropped.incrementAndGet();
                // Only shout occasionally: a full queue means the DB is struggling, and a log
                // storm would make that worse.
                if (n == 1 || n % 100 == 0) {
                    logger.warn("Activity log queue full, dropped {} row(s) so far", n);
                }
            }
        } catch (Throwable ignored) {
            // submit() is called from the login path and from afterCompletion; it cannot fail.
        }
    }

    @jakarta.annotation.PostConstruct
    void start() {
        worker = new Thread(this::drainLoop, "activity-log-writer");
        worker.setDaemon(true);
        worker.start();
    }

    private void drainLoop() {
        while (running || !queue.isEmpty()) {
            ActivityLog log = null;
            try {
                log = queue.poll(500, TimeUnit.MILLISECONDS);
                if (log != null) {
                    txWriter.insert(log);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            } catch (Throwable t) {
                // Includes CannotCreateTransactionException from begin and
                // UnexpectedRollbackException/TransactionSystemException from commit.
                logger.warn("Activity log write failed ({}): {}",
                        log != null ? log.getEventType() + " " + log.getSummary() : "unknown",
                        t.getMessage());
            }
        }
    }

    /** Give queued rows a brief chance to land on a clean shutdown/redeploy. */
    @PreDestroy
    void stop() {
        running = false;
        if (worker != null) {
            try {
                worker.join(SHUTDOWN_DRAIN_MS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        long lost = dropped.get() + queue.size();
        if (lost > 0) {
            logger.warn("Activity log shutdown with {} row(s) not persisted", lost);
        }
    }
}
