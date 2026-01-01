/**
 * Login Page - Professional Design
 * Clean, Modern UI without Social Login
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLoginMutation } from '../../features/auth/authApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setCredentials } from '../../features/auth/authSlice';
import { loginSchema, type LoginFormData } from '../../features/auth/authSchemas';
import type { User } from '../../types';
import { UserRole } from '../../types';
import { ROUTES } from '../../routes/routes.config';
import { Eye, EyeOff, Lock, Mail, ChefHat, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [login, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const loginData = {
        email: data.username || '',
        password: data.password || '',
      };

      const response = await login(loginData).unwrap();

      if (response.success && response.data) {
        try {
          const raw = response.data as any;
          const token: string | undefined = raw.accessToken || raw.token;
          const roles: string[] | undefined = raw.user?.roles || raw.roles;
          const primaryRole = (roles && roles.length > 0 ? roles[0] : undefined) as keyof typeof UserRole | undefined;
          const mappedUser: User | undefined = raw.user
            ? {
                id: raw.user.id ?? raw.id,
                username: raw.user.username ?? raw.user.name ?? (raw.user.email ? String(raw.user.email).split('@')[0] : 'user'),
                email: raw.user.email ?? raw.email ?? '',
                role: (primaryRole && UserRole[primaryRole]) || UserRole.ROLE_STAFF,
              }
            : {
                id: raw.id,
                username: raw.name ?? (raw.email ? String(raw.email).split('@')[0] : 'user'),
                email: raw.email ?? '',
                role: (primaryRole && UserRole[primaryRole]) || UserRole.ROLE_STAFF,
              };

          if (!mappedUser || !token) {
            toast.error('Login succeeded but response was invalid. Please try again.');
            return;
          }

          dispatch(
            setCredentials({
              user: mappedUser,
              token,
            })
          );

          const displayName = mappedUser.username || mappedUser.email || 'User';
          toast.success(`Welcome back, ${displayName}!`);

        } catch (dispatchError) {
          console.error('Error during dispatch:', dispatchError);
          toast.error('Login successful but failed to save credentials. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage =
        error?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <ErrorDisplay />
      <div className="login-container">
        {/* Left Section - Login Form */}
        <div className="login-left-section">
          <div className="login-form-wrapper">
            {/* Logo & Header */}
            <div className="login-header">
              <div className="login-logo">
                <ChefHat strokeWidth={1.5} />
              </div>
              <h1 className="login-title">Welcome to HOCH</h1>
              <p className="login-subtitle">
                Sign in to manage your kitchen business
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="login-form">
              {/* Email Field */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="form-input-container">
                  <Mail className="form-input-icon" strokeWidth={1.5} />
                  <input
                    type="email"
                    {...register('username')}
                    className={`form-input ${errors.username ? 'error' : ''}`}
                    placeholder="name@company.com"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {errors.username && (
                  <p className="error-message">{errors.username.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="form-input-container">
                  <Lock className="form-input-icon" strokeWidth={1.5} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff strokeWidth={1.5} /> : <Eye strokeWidth={1.5} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="error-message">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" name="remember-me" />
                  <span>Keep me signed in</span>
                </label>
                <Link to="#" className="forgot-password">
                  Forgot password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="login-button"
              >
                {isLoading ? (
                  <span className="login-loading">
                    <span className="spinner"></span>
                    Signing in...
                  </span>
                ) : (
                  <span className="login-button-content">
                    Sign In
                    <ArrowRight strokeWidth={2} size={18} />
                  </span>
                )}
              </button>
            </form>

            {/* Signup Link */}
            <div className="signup-link">
              <span>New to HOCH?</span>
              <Link to={ROUTES.SIGNUP}>Create an account</Link>
            </div>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p>&copy; {new Date().getFullYear()} HOCH Kitchen CRM. All rights reserved.</p>
          </div>
        </div>

        {/* Right Section - Hero/Brand */}
        <div className="login-right-section">
          <div className="right-background">
            <div className="bg-pattern"></div>
            <div className="bg-gradient"></div>
          </div>

          <div className="right-content">
            <div className="hero-icon">
              <ChefHat strokeWidth={1} />
            </div>
            <h2 className="hero-title">
              Streamline Your Kitchen Operations
            </h2>
            <p className="hero-subtitle">
              Manage customers, quotations, projects, and production all in one powerful platform designed for modern kitchen businesses.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Customer & Project Management</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Quotation & Invoice Generation</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Production Tracking & Scheduling</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Real-time Analytics & Reports</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
