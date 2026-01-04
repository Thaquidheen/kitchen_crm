/**
 * Forgot Password Page
 * Allows users to request a password reset email
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useForgotPasswordMutation } from '../../features/auth/authApi';
import { ROUTES } from '../../routes/routes.config';
import { Mail, ArrowLeft, ChefHat } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const response = await forgotPassword({ email: data.email }).unwrap();
      if (response.success) {
        setEmailSent(true);
        toast.success('Check your email for reset instructions');
      }
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || 'Failed to send reset email');
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-black-900 flex items-center justify-center p-8">
        <div className="max-w-md w-full gradient-card p-8 rounded-lg border-2 border-red-700 text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white-900 mb-4">
            Check Your Email
          </h1>
          <p className="text-white-700 mb-6">
            If your email is registered, you will receive a password reset link shortly.
            The link will expire in 30 minutes.
          </p>
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
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
            Forgot Password?
          </h1>
          <p className="text-white-700">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-white-800 text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white-600" size={20} />
              <input
                type="email"
                {...register('email')}
                className={`w-full pl-10 pr-4 py-3 bg-black-700 border rounded-lg text-white-900 focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-black-600 focus:border-red-700 focus:ring-red-700'
                }`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-red-700 hover:bg-red-600 text-white-900 font-semibold rounded-lg shadow-red transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPasswordPage;
