package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.QuotationCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.QuotationDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;

/**
 * Prices a quotation as it would be saved, without saving it. Staff are not given the margin
 * percentages, so their screen cannot work out what a change does to the price; it asks here.
 *
 * The quotation is saved exactly as a save would (same code, so the same figures), the answer is
 * built for the caller as after a save (what they may not see is left out), and the transaction is
 * then rolled back: nothing of the quotation is kept. The save path writes only to the database —
 * no files, mail or messages — so the rollback undoes all of it; only the ids it used are not
 * given back (MySQL does not reuse them). The activity log leaves previews out.
 *
 * Like a save it locks the quotation first (QuotationRepository.findByIdForUpdate), so it waits
 * for a save in progress rather than racing it; the time limit keeps a slow server from piling
 * previews up.
 */
@Service
public class QuotationPreviewService {

    @Autowired
    private QuotationService quotationService;

    /** A quotation being edited, priced with the changes on the screen. */
    @Transactional(timeout = 20)
    public ApiResponse<QuotationDto> previewUpdate(Long id, QuotationDto dto, String user, String pricingView) {
        try {
            return quotationService.updateQuotation(id, dto, user, pricingView);
        } finally {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        }
    }

    /** A new quotation (or a new version of one), priced before it is first saved. */
    @Transactional(timeout = 20)
    public ApiResponse<QuotationDto> previewCreate(QuotationCreateDto dto, String user, String pricingView) {
        try {
            return quotationService.createQuotation(dto, user, pricingView);
        } finally {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        }
    }
}
