/**
 * ChangePasswordModal
 * Lets the signed-in user change their own password. Until this existed a password could only
 * be set when the account was created, or through an emailed reset link.
 *
 * The server revokes every refresh token on success, so the session is deliberately ended and
 * the user is sent back to the login screen.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { useChangePasswordMutation } from '../authApi';
import { logout } from '../authSlice';
import { useAppDispatch } from '@/app/hooks';
import { ROUTES } from '@/routes/routes.config';

// Mirrors the backend rule on ChangePasswordRequest / ResetPasswordRequest exactly, so the
// user is told about a weak password before the round trip rather than after.
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be between 8 and 50 characters')
      .max(50, 'Password must be between 8 and 50 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
        'Must contain an uppercase letter, a lowercase letter and a number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm the new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: 'New password must be different from the current one',
    path: ['newPassword'],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const inputCls =
  'w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500';
const labelCls = 'block text-[12.5px] font-medium text-text-800 mb-1.5';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  const onSubmit = async (values: ChangePasswordValues) => {
    try {
      const res = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();

      if (res?.success === false) {
        toast.error(res?.message || 'Could not change password');
        return;
      }

      toast.success('Password changed — please sign in again');
      onClose();
      // Every refresh token was revoked server-side; clear locally and send them to login.
      dispatch(logout());
      navigate(ROUTES.LOGIN);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Could not change password');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change password" size="sm">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody>
          <div className="space-y-3.5">
            <div>
              <label className={labelCls}>
                Current password <span className="text-error">*</span>
              </label>
              <input
                type="password"
                autoComplete="current-password"
                className={inputCls}
                {...register('currentPassword')}
              />
              {errors.currentPassword && (
                <p className="text-error text-xs mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className={labelCls}>
                New password <span className="text-error">*</span>
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className={inputCls}
                {...register('newPassword')}
              />
              {errors.newPassword ? (
                <p className="text-error text-xs mt-1">{errors.newPassword.message}</p>
              ) : (
                <p className="text-[11.5px] text-text-600 mt-1">
                  At least 8 characters, with an uppercase letter, a lowercase letter and a number.
                </p>
              )}
            </div>

            <div>
              <label className={labelCls}>
                Confirm new password <span className="text-error">*</span>
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className={inputCls}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-error text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <p className="text-[11.5px] text-text-600">
              You will be signed out of every device and need to sign in again.
            </p>
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700 hover:text-text-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-raised-accent inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60"
          >
            {isLoading ? 'Changing…' : 'Change password'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default ChangePasswordModal;
