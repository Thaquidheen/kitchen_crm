/**
 * CustomerStarButton — the star of a priority customer, as on Architects: one star for the whole
 * team; starred customers stay at the top of the list. Whoever may edit customers sets it; anyone
 * else sees the star but cannot change it.
 */
import React from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePermissions } from '@/features/permissions/usePermissions';
import { useToggleCustomerHighlightMutation } from '../customersAPI';

export const STAR_COLOR = '#f5b301';

/** The row of a starred customer in a table, as on Architects. */
export const starredRowStyle: React.CSSProperties = {
  background: `color-mix(in oklab, ${STAR_COLOR} 8%, transparent)`,
  boxShadow: `inset 3px 0 0 ${STAR_COLOR}`,
};

interface Props {
  id: number;
  highlighted?: boolean | null;
  size?: number;
  className?: string;
}

export const CustomerStarButton: React.FC<Props> = ({ id, highlighted, size = 14, className = '' }) => {
  const { can } = usePermissions();
  const [toggle, { isLoading }] = useToggleCustomerHighlightMutation();
  const on = !!highlighted;

  if (!can('customers.edit')) {
    return on ? (
      <span title="Starred" className={`inline-flex items-center justify-center ${className}`}>
        <Star size={size} fill={STAR_COLOR} color={STAR_COLOR} />
      </span>
    ) : null;
  }

  const flip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggle({ id, highlighted: !on }).unwrap();
      toast.success(on ? 'Star removed' : 'Starred — kept at the top of the list');
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to change the star');
    }
  };

  return (
    <button
      type="button"
      onClick={flip}
      disabled={isLoading}
      title={on ? 'Remove the star' : 'Star (priority customer, kept at the top)'}
      aria-label={on ? 'Remove the star' : 'Star this customer'}
      aria-pressed={on}
      className={`inline-flex items-center justify-center rounded-lg text-text-500 hover:bg-background-600 hover:text-text-900 disabled:opacity-60 transition-colors ${className}`}
      style={on ? { color: STAR_COLOR } : undefined}
    >
      <Star size={size} fill={on ? STAR_COLOR : 'none'} />
    </button>
  );
};

export default CustomerStarButton;
