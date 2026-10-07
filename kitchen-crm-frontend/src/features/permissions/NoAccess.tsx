import React from 'react';
import { Lock } from 'lucide-react';

/** Shown in place of a page the administrator has not allowed for this person's staff type. */
export const NoAccess: React.FC<{ what: string }> = ({ what }) => (
  <div className="bg-background-800 border border-background-600 rounded-[14px] px-6 py-14 text-center">
    <Lock size={26} className="mx-auto text-text-500" />
    <div className="text-[14.5px] font-semibold text-text-900 mt-3">You do not have access to {what}</div>
    <div className="text-[12.5px] text-text-700 mt-1">Ask the administrator to allow it in Permissions.</div>
  </div>
);

export default NoAccess;
