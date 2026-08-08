package com.fleetmanagement.kitchencrmbackend.modules.finance.repository;

import com.fleetmanagement.kitchencrmbackend.modules.finance.entity.FinanceReceiptFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface FinanceReceiptFileRepository extends JpaRepository<FinanceReceiptFile, Long> {

    List<FinanceReceiptFile> findByPaymentId(Long paymentId);

    List<FinanceReceiptFile> findByExpenseId(Long expenseId);

    List<FinanceReceiptFile> findByReleaseId(Long releaseId);

    List<FinanceReceiptFile> findByPaymentIdIn(Collection<Long> paymentIds);

    List<FinanceReceiptFile> findByExpenseIdIn(Collection<Long> expenseIds);

    List<FinanceReceiptFile> findByReleaseIdIn(Collection<Long> releaseIds);
}
