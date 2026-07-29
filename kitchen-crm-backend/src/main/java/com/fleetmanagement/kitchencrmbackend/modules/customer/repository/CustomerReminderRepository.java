package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CustomerReminderRepository extends JpaRepository<CustomerReminder, Long> {

    List<CustomerReminder> findByCustomerIdOrderByRemindAtDesc(Long customerId);

    // Scheduler: pending reminders whose time has arrived
    List<CustomerReminder> findByStatusAndRemindAtBefore(CustomerReminder.ReminderStatus status, LocalDateTime time);

    // Bell: everything currently due (until marked done), newest first
    List<CustomerReminder> findByStatusOrderByRemindAtDesc(CustomerReminder.ReminderStatus status);

    // Reminders list: not-done reminders ordered soonest first
    List<CustomerReminder> findByStatusInOrderByRemindAtAsc(List<CustomerReminder.ReminderStatus> statuses);

    Long countByStatus(CustomerReminder.ReminderStatus status);
}
