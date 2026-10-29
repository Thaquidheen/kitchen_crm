/**
 * One place that applies a customer status change together with what the design workflow hangs on
 * it: a designer (and plan documents) when moving to Design Stage, and the design files when
 * moving a customer whose design was made elsewhere to Quotation Stage.
 */
import { useCallback } from 'react';
import { useUpdateCustomerStatusMutation } from './customersAPI';
import { useUploadCustomerDesignMutation, useUploadCustomerPlanDocumentsMutation } from '../design/designAPI';
import type { DesignAssignment } from '../design/components/DesignerPicker';
import type { CustomerStatus } from './types';
import { useRequestStageMoveMutation } from './stageRequestsAPI';
import { needsApproval } from './stageRequestRules';

export interface StatusChangeExtras {
  /** Moving to Design Stage: who designs it, by when, how urgent. */
  design?: DesignAssignment;
  /** Moving to Design Stage: plan documents for the designer (the admin and Admin staff). */
  planFiles?: File[];
  /** Moving to Quotation Stage without an approved design: the finished design (PDF, images, CAD). */
  designFiles?: File[];
  /** Moving to Confirmed: the completed quotation that becomes Approved (the newest when left out). */
  approveQuotationId?: number;
}

export interface StatusChangeResult {
  /** The status changed, but something that rides along with it did not. */
  warning?: string;
  /** The move needs the admin's approval: a request was sent instead, the status did not change. */
  requested?: boolean;
}

const errMsg = (e: any, fallback: string) => e?.message || e?.data?.message || fallback;

export function useCustomerStatusChange() {
  const [updateStatus] = useUpdateCustomerStatusMutation();
  const [uploadCustomerDesign] = useUploadCustomerDesignMutation();
  const [uploadPlanDocuments] = useUploadCustomerPlanDocumentsMutation();
  const [requestStageMove] = useRequestStageMoveMutation();

  /** Throws when the status itself could not be changed. */
  return useCallback(
    async (args: {
      customerId: number;
      status: CustomerStatus;
      note: string;
      extras?: StatusChangeExtras;
    }): Promise<StatusChangeResult> => {
      const { customerId, status, note, extras } = args;

      // Back from Follow Up to Design or Quotation Stage needs the admin's approval: when the server
      // says so, the same note goes to the admin as a request, and the customer stays where they are.
      const askInstead = async (e: unknown): Promise<StatusChangeResult> => {
        if (!needsApproval(errMsg(e, ''))) {throw e;}
        await requestStageMove({ customerId, toStage: status, reason: note }).unwrap();
        return { requested: true };
      };

      // The upload saves the files as the customer's design and moves them in the same request,
      // so a customer never lands in Quotation Stage without it.
      if (status === 'QUOTE_GIVEN' && extras?.designFiles && extras.designFiles.length > 0) {
        try {
          await uploadCustomerDesign({ customerId, files: extras.designFiles, note, moveToQuotation: true }).unwrap();
        } catch (e) {
          return askInstead(e);
        }
        return {};
      }

      try {
        await updateStatus({
          id: customerId,
          status,
          reason: note,
          designerId: extras?.design?.designerId ?? undefined,
          designDueDate: extras?.design?.dueDate || undefined,
          designPriority: extras?.design?.priority,
          approveQuotationId: status === 'CONFIRMED' ? extras?.approveQuotationId : undefined,
        }).unwrap();
      } catch (e) {
        return askInstead(e);
      }

      const planFiles = extras?.planFiles ?? [];
      if (status === 'DESIGN_STAGE' && planFiles.length > 0) {
        try {
          // By customer: when Admin staff move the customer, no designer has the design yet and
          // the documents wait with the customer for whoever is chosen.
          await uploadPlanDocuments({ customerId, files: planFiles }).unwrap();
        } catch (e) {
          return {
            warning: `Status updated, but the plan documents were not added: ${errMsg(e, 'upload failed')}. Add them from the Design box on the customer's page.`,
          };
        }
      }
      return {};
    },
    [updateStatus, uploadCustomerDesign, uploadPlanDocuments, requestStageMove],
  );
}
