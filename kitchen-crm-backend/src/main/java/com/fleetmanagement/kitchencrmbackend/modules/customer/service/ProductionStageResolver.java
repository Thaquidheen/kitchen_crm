package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.ProductionTaskGroupDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionCustomTask;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionInstallation;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionTaskGroup;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.WorkflowHistory;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionCustomTaskRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionInstallationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.ProductionTaskGroupRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.WorkflowHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * The ONE rule for "which stage is this job in, and what is its status", derived from the
 * checklist ticks. Every screen (list buckets, header badge, checklist auto-expand) and the
 * dashboard's {@code overall_status} column read this rule, so they can never disagree.
 *
 * Only top-level stages can be "current": sub-stage ticks roll up into their parent through
 * {@link ProductionTaskGroupDto#fromEntity}, so a sub-stage title never leaks into the badge.
 *
 * <pre>
 *   no tasks                    -> nulls; the stored column is kept (legacy job, unchanged)
 *   handoverToClient == true    -> COMPLETED, last stage
 *   done == total               -> COMPLETED, last stage
 *   lastWithProgress = max i where done_i > 0                     (0 if none)
 *   firstIncomplete  = min i where total_i > 0 and done_i < total_i (0 if none)
 *   current = max(lastWithProgress, firstIncomplete)
 *   done == 0                   -> NOT_STARTED, stage current
 *   else                        -> IN_PROGRESS, stage current
 * </pre>
 *
 * A finished stage is never "current": with Stage 1 at 11/11 and Stage 2 at 0/7 the job is in
 * Stage 2, because firstIncomplete wins over lastWithProgress.
 *
 * Depends on repositories only, so the task and task-group services can inject it without a
 * bean cycle through {@link ProductionInstallationServiceImpl}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProductionStageResolver {

    public static final String STATUS_NOT_STARTED = "NOT_STARTED";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_COMPLETED = "COMPLETED";

    private final ProductionTaskGroupRepository productionTaskGroupRepository;
    private final ProductionCustomTaskRepository productionCustomTaskRepository;
    private final ProductionInstallationRepository productionInstallationRepository;
    private final WorkflowHistoryRepository workflowHistoryRepository;

    /**
     * @param derivedStatus     NOT_STARTED | IN_PROGRESS | COMPLETED, or null for a job without tasks
     * @param currentStageIndex 1-based index of the current top-level stage, or null
     * @param currentStageName  title of that stage, or null
     * @param mappedStatus      the value the {@code overall_status} column should hold — always one
     *                          of the previous jar's enum values so a rollback stays jar-only
     */
    public record StageSnapshot(String derivedStatus,
                                Integer currentStageIndex,
                                String currentStageName,
                                ProductionInstallation.InstallationStatus mappedStatus) {
    }

    /** Resolves the snapshot, loading the job's tasks itself. */
    public StageSnapshot resolve(ProductionInstallation installation) {
        List<ProductionCustomTask> tasks = productionCustomTaskRepository
                .findByProductionInstallationIdOrderBySortOrderAsc(installation.getId());
        return resolve(installation, tasks);
    }

    /**
     * Resolves the snapshot from an already-loaded task list (every task of the job, grouped or
     * not). Ungrouped tasks count towards done/total but never towards a stage.
     */
    public StageSnapshot resolve(ProductionInstallation installation, List<ProductionCustomTask> allTasks) {
        if (allTasks == null || allTasks.isEmpty()) {
            return new StageSnapshot(null, null, null, installation.getOverallStatus());
        }

        List<ProductionTaskGroupDto> stages = productionTaskGroupRepository
                .findByCustomerIdWithTasks(installation.getCustomer().getId())
                .stream()
                .map(ProductionTaskGroupDto::fromEntity)
                .collect(Collectors.toList());

        int totalAll = allTasks.size();
        long doneAll = allTasks.stream().filter(t -> Boolean.TRUE.equals(t.getCompleted())).count();

        Integer lastIndex = stages.isEmpty() ? null : stages.size();
        String lastName = stages.isEmpty() ? null : stages.get(stages.size() - 1).getGroupTitle();

        if (Boolean.TRUE.equals(installation.getHandoverToClient()) || doneAll == totalAll) {
            return new StageSnapshot(STATUS_COMPLETED, lastIndex, lastName,
                    ProductionInstallation.InstallationStatus.COMPLETED);
        }

        int lastWithProgress = 0;
        int firstIncomplete = 0;
        for (int i = 0; i < stages.size(); i++) {
            ProductionTaskGroupDto stage = stages.get(i);
            int total = stage.getTotalTasks() != null ? stage.getTotalTasks() : 0;
            int done = stage.getCompletedTasks() != null ? stage.getCompletedTasks() : 0;
            int index = i + 1;
            if (done > 0) {
                lastWithProgress = index;
            }
            if (firstIncomplete == 0 && total > 0 && done < total) {
                firstIncomplete = index;
            }
        }
        int current = Math.max(lastWithProgress, firstIncomplete);
        Integer currentIndex = current > 0 ? current : null;
        String currentName = current > 0 ? stages.get(current - 1).getGroupTitle() : null;

        if (doneAll == 0) {
            return new StageSnapshot(STATUS_NOT_STARTED, currentIndex, currentName,
                    ProductionInstallation.InstallationStatus.NOT_STARTED);
        }
        return new StageSnapshot(STATUS_IN_PROGRESS, currentIndex, currentName, mapInProgress(currentIndex));
    }

    /**
     * Stage index -> column value. 1 -> PRODUCTION, 2 -> INSTALLATION, 3+ -> QUALITY_CHECK. A job
     * with progress but no stage to pin it to (only ungrouped tasks) reads as PRODUCTION, the
     * earliest in-progress value.
     */
    private static ProductionInstallation.InstallationStatus mapInProgress(Integer stageIndex) {
        if (stageIndex == null || stageIndex <= 1) {
            return ProductionInstallation.InstallationStatus.PRODUCTION;
        }
        if (stageIndex == 2) {
            return ProductionInstallation.InstallationStatus.INSTALLATION;
        }
        return ProductionInstallation.InstallationStatus.QUALITY_CHECK;
    }

    /**
     * Writes the derived status through to {@code overall_status} so every dashboard query that
     * reads the column stays valid. Saves only when the value actually changes, and records the
     * change in workflow history exactly like the legacy auto-update did.
     *
     * @return true when the column was rewritten
     */
    @Transactional
    public boolean syncOverallStatus(ProductionInstallation installation, String changedBy) {
        return syncOverallStatus(installation, null, changedBy);
    }

    /** Same as {@link #syncOverallStatus(ProductionInstallation, String)} with tasks already loaded. */
    @Transactional
    public boolean syncOverallStatus(ProductionInstallation installation,
                                     List<ProductionCustomTask> allTasks, String changedBy) {
        StageSnapshot snapshot = allTasks != null ? resolve(installation, allTasks) : resolve(installation);
        ProductionInstallation.InstallationStatus mapped = snapshot.mappedStatus();
        if (mapped == null || mapped == installation.getOverallStatus()) {
            return false;
        }

        ProductionInstallation.InstallationStatus previous = installation.getOverallStatus();
        installation.setOverallStatus(mapped);
        productionInstallationRepository.save(installation);

        String stage = snapshot.currentStageIndex() != null
                ? " (stage " + snapshot.currentStageIndex() + ": " + snapshot.currentStageName() + ")"
                : "";
        WorkflowHistory history = new WorkflowHistory();
        history.setCustomer(installation.getCustomer());
        history.setPreviousState("Status Auto-Updated");
        history.setNewState(mapped.name());
        history.setChangedBy(changedBy != null ? changedBy : "System");
        history.setChangeReason("Status automatically updated from " + previous + " to " + mapped
                + " from the checklist" + stage);
        history.setTimestamp(LocalDateTime.now());
        workflowHistoryRepository.save(history);
        return true;
    }

    /**
     * One-off backfill on boot: rows written before this rule existed (hand-set, On Hold,
     * Cancelled, or never touched) are rewritten to their derived value. Idempotent — a second
     * boot rewrites nothing — and switchable via {@code app.production.recompute-status-on-boot}.
     * Per-row transactions through the resolver proxy, so one bad row cannot abort the boot.
     */
    @Component
    @RequiredArgsConstructor
    public static class RecomputeStatusOnBoot implements ApplicationRunner {

        private final ProductionStageResolver resolver;
        private final ProductionInstallationRepository productionInstallationRepository;

        @Value("${app.production.recompute-status-on-boot:true}")
        private boolean enabled;

        @Override
        public void run(ApplicationArguments args) {
            if (!enabled) {
                log.info("Production status backfill skipped (app.production.recompute-status-on-boot=false)");
                return;
            }
            int rewritten = 0;
            int failed = 0;
            List<ProductionInstallation> installations = productionInstallationRepository.findAll();
            for (ProductionInstallation installation : installations) {
                try {
                    if (resolver.syncOverallStatus(installation, "System")) {
                        rewritten++;
                    }
                } catch (Exception e) {
                    failed++;
                    log.warn("Production status backfill failed for installation {}: {}",
                            installation.getId(), e.getMessage());
                }
            }
            log.info("Production status backfill: {} of {} rows rewritten from the checklist ({} failed)",
                    rewritten, installations.size(), failed);
        }
    }
}
