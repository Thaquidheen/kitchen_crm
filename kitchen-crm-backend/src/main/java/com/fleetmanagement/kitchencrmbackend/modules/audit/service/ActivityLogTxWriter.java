package com.fleetmanagement.kitchencrmbackend.modules.audit.service;

import com.fleetmanagement.kitchencrmbackend.modules.audit.entity.ActivityLog;
import com.fleetmanagement.kitchencrmbackend.modules.audit.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * The only transactional step of an audit write, deliberately isolated in its own bean.
 *
 * The transaction must live one call deeper than the swallow. @Transactional is applied by a
 * Spring proxy, so begin (before the method body) and commit (after it) both sit OUTSIDE any
 * try/catch written inside the annotated method — a pool-exhaustion failure on begin, or a
 * rollback-only commit after a swallowed SQLException, would escape such a catch and propagate
 * into the caller. Keeping this method bare and letting {@link ActivityLogWriter} guard the call
 * is what makes the swallow total.
 */
@Component
public class ActivityLogTxWriter {

    @Autowired
    private ActivityLogRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void insert(ActivityLog log) {
        repository.save(log);
    }
}
