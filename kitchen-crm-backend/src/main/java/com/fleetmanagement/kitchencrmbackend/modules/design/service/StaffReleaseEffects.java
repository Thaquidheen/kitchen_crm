package com.fleetmanagement.kitchencrmbackend.modules.design.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase.DesignStatus;
import com.fleetmanagement.kitchencrmbackend.modules.design.repository.DesignJobRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.entity.QuotationJob;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.repository.QuotationJobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;

/**
 * A staff member who leaves (deactivated) or stops being a designer cannot keep work nobody else
 * sees: their designs being made go back under Designs › To assign, and their open quotation work
 * leaves the board, for the admin to hand to someone else (the owner's rule, 2026-10-29). Designs
 * waiting for the admin's review stay where they are: the admin decides them anyway.
 *
 * Repositories only: the user service calls it.
 */
@Component
public class StaffReleaseEffects {

    private static final Set<DesignStatus> BEING_MADE = EnumSet.of(
            DesignStatus.PLANNING, DesignStatus.IN_PROGRESS, DesignStatus.REVISION_REQUIRED);
    private static final Set<String> OPEN_WORK = Set.of(QuotationJob.WAITING, QuotationJob.IN_PROGRESS);

    @Autowired
    private DesignJobRepository designJobRepository;
    @Autowired
    private QuotationJobRepository quotationJobRepository;

    /** Their designs being made go back to To assign. Returns how many. */
    public int releaseDesigns(Long userId) {
        int released = 0;
        for (DesignPhase job : designJobRepository.findByDesigner(userId)) {
            if (job.getDesignStatus() != null && BEING_MADE.contains(job.getDesignStatus())) {
                job.setStaffAssigned(null);
                job.setQueuePosition(null);
                designJobRepository.save(job);
                released++;
            }
        }
        return released;
    }

    /** Their open quotation work leaves the board. Returns how many. */
    public int releaseQuotationWork(Long userId) {
        int released = 0;
        for (QuotationJob job : quotationJobRepository.findByAssigneeAndStatuses(userId, OPEN_WORK)) {
            job.setStatus(QuotationJob.CANCELLED);
            job.setAssigneeNews("No longer with you: handed back to be assigned again");
            quotationJobRepository.save(job);
            released++;
        }
        return released;
    }

    /** The words added to a reply. */
    public static String released(int designs, int work) {
        StringBuilder out = new StringBuilder();
        if (designs > 0) {
            out.append("; ").append(designs).append(designs == 1 ? " design" : " designs").append(" went back to To assign in Designs");
        }
        if (work > 0) {
            out.append("; ").append(work).append(" quotation").append(work == 1 ? " was" : "s were")
                    .append(" taken off the work board to be assigned again");
        }
        return out.toString();
    }
}
