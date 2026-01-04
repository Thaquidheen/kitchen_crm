/**
 * Reset Password Page
 * Allows users to set a new password using a reset token
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useResetPasswordMutation, useValidateResetTokenQuery } from '../../features/auth/authApi';
import { ROUTES } from '../../routes/routes.config';
import { Lock, Eye, EyeOff, ArrowLeft, ChefHat, CheckCircle, XCircle } from 'lucide-react';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .max(50, 'Password must be less than 50 characters')
      .regex(
        passwordRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const { data: tokenValidation, isLoading: isValidating, error: tokenError } = useValidateResetTokenQuery(token, {
    skip: !token,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link');
      navigate(ROUTES.LOGIN);
    }
  }, [token, navigate]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      const response = await resetPassword({
        token,
        newPassword: data.newPassword,
      }).unwrap();

      if (response.success) {
        setResetComplete(true);
        toast.success('Password reset successfully!');
      }
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || 'Failed to reset password');
    }
  };

  // Show loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen bg-black-900 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-700 mx-auto mb-4"></div>
          <p className="text-white-700">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenError || (tokenValidation && !tokenValidation.success)) {
    return (
      <div className="min-h-screen bg-black-900 flex items-center justify-center p-8">
        <div className="max-w-md w-full gradient-card p-8 rounded-lg border-2 border-red-700 text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white-900 mb-4">
            Invalid or Expired Link
          </h1>
          <p className="text-white-700 mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            to={ROUTES.FORGOT_PASSWORD || '/forgot-password'}
            className="inline-block px-6 py-3 bg-red-700 hover:bg-red-600 text-white-900 font-semibold rounded-lg transition-all"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  // Show success message after password reset
  if (resetComplete) {
    return (
      <div className="min-h-screen bg-black-900 flex items-center justify-center p-8">
        <div className="max-w-md w-full gradient-card p-8 rounded-lg border-2 border-red-700 text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white-900 mb-4">
            Password Reset Complete
          </h1>
          <p className="text-white-700 mb-6">
            Your password has been successfully reset. You can now login with your new password.
          </p>
          <Link
            to={ROUTES.LOGIN}
            className="inline-block px-6 py-3 bg-red-700 hover:bg-red-600 text-white-900 font-semibold rounded-lg transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full gradient-card p-8 rounded-lg border-2 border-red-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white-900 mb-2">
            Reset Password
          </h1>
          <p className="text-white-700">Enter your new password below</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-white-800 text-sm font-medium mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white-600" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('newPassword')}
                className={`w-full pl-10 pr-12 py-3 bg-black-700 border rounded-lg text-white-900 focus:outline-none focus:ring-2 transition-all ${
                  errors.newPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-black-600 focus:border-red-700 focus:ring-red-700'
                }`}
                placeholder="Enter new password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white-600 hover:text-white-900"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-white-600">
              Min 8 characters with uppercase, lowercase, and number
            </p>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-white-800 text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white-600" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                className={`w-full pl-10 pr-12 py-3 bg-black-700 border rounded-lg text-white-900 focus:outline-none focus:ring-2 transition-all ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-black-600 focus:border-red-700 focus:ring-red-700'
                }`}
                placeholder="Confirm new password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white-600 hover:text-white-900"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-red-700 hover:bg-red-600 text-white-900 font-semibold rounded-lg shadow-red transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center gap-2 text-white-600 hover:text-white-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
