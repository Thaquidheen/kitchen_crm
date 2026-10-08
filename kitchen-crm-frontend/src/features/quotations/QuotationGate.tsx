/**
 * QuotationGate — puts "you do not have access" in place of a quotation page the administrator
 * has not allowed for this person's staff type. The server refuses the same requests; this is so
 * the person is told why instead of meeting a broken page.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { NoAccess } from '@/features/permissions/NoAccess';
import { useQuotationAccess } from './useQuotationAccess';

interface Props {
  /** `builder` needs "create" for a new quotation and "edit" for an existing one. */
  need: 'view' | 'builder';
  children: React.ReactNode;
}

export const QuotationGate: React.FC<Props> = ({ need, children }) => {
  const access = useQuotationAccess();
  const { id } = useParams<{ id: string }>();
  if (!access.ready) {
    return <div className="bg-background-800 border border-background-600 rounded-[14px] p-6 animate-pulse h-40" />;
  }
  if (!access.view) {
    return <NoAccess what="quotations" />;
  }
  if (need === 'builder' && !(id ? access.edit : access.create)) {
    return <NoAccess what={id ? 'editing quotations' : 'creating quotations'} />;
  }
  return <>{children}</>;
};

export default QuotationGate;
