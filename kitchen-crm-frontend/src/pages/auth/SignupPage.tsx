/**
 * Signup Page
 * Handles user registration with form validation
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSignupMutation } from '../../features/auth/authApi';
import { useAppDispatch } from '../../app/hooks';
import { setCredentials } from '../../features/auth/authSlice';
import {
  signupSchema,
  type SignupFormData,
} from '../../features/auth/authSchemas';
import { ROUTES } from '../../routes/routes.config';

const SignupPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [signup, { isLoading }] = useSignupMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...signupData } = data;
      
      // Add role property
      const signupDataWithRole = {
        ...signupData,
        role: 'ROLE_STAFF', // Default role for new users
      };

      const response = await signup(signupDataWithRole).unwrap();

      if (response.success && response.data) {
        // Store credentials in Redux
        dispatch(
          setCredentials({
            user: response.data.user,
            token: response.data.accessToken,
          })
        );

        // Show success message
        toast.success(`Welcome to HOCH, ${response.data.user.username}!`);

        // Navigate to dashboard
        navigate(ROUTES.DASHBOARD);
      }
    } catch (error: any) {
      // Handle error
      const errorMessage =
        error?.data?.message || 'Signup failed. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-black-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full gradient-card p-8 rounded-lg border-2 border-red-700">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-white-900 mb-2">
            HOCH
          </h1>
          <p className="text-white-700">Create your account</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-white-800 text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              {...register('name')}
              className={`w-full px-4 py-3 bg-black-700 border rounded-lg text-white-900 focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-black-600 focus:border-red-700 focus:ring-red-700'
              }`}
              placeholder="Enter your full name"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-white-800 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className={`w-full px-4 py-3 bg-black-700 border rounded-lg text-white-900 focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-black-600 focus:border-red-700 focus:ring-red-700'
              }`}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-white-800 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              {...register('password')}
              className={`w-full px-4 py-3 bg-black-700 border rounded-lg text-white-900 focus:outline-none focus:ring-2 transition-all ${
                errors.password
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-black-600 focus:border-red-700 focus:ring-red-700'
              }`}
              placeholder="Create a password"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-white-600">
              Min 8 characters with uppercase, lowercase, and number
            </p>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-white-800 text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              {...register('confirmPassword')}
              className={`w-full px-4 py-3 bg-black-700 border rounded-lg text-white-900 focus:outline-none focus:ring-2 transition-all ${
                errors.confirmPassword
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-black-600 focus:border-red-700 focus:ring-red-700'
              }`}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-red-700 hover:bg-red-600 text-white-900 font-semibold rounded-lg shadow-red transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-white-600 text-sm text-center mt-6">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="text-red-500 hover:text-red-400 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
