# Authentication Module

This module handles user authentication and authorization for the Kitchen CRM application.

## Features

- **Login**: User authentication with username and password
- **Signup**: User registration with form validation
- **JWT Token Management**: Automatic token storage and refresh
- **Protected Routes**: Role-based access control
- **Toast Notifications**: User feedback for all auth actions
- **Form Validation**: Zod schemas with react-hook-form

## Files

### API Layer
- `authApi.ts`: RTK Query endpoints for authentication operations
- `authSlice.ts`: Redux state management for auth

### Validation
- `authSchemas.ts`: Zod validation schemas for login and signup forms

### Pages
- `../../pages/auth/LoginPage.tsx`: Login page UI
- `../../pages/auth/SignupPage.tsx`: Signup page UI

## Usage

### Login
```tsx
import { useLoginMutation } from '../../features/auth/authApi';

const [login, { isLoading }] = useLoginMutation();

const handleLogin = async (data) => {
  const response = await login(data).unwrap();
  // Handle success
};
```

### Signup
```tsx
import { useSignupMutation } from '../../features/auth/authApi';

const [signup, { isLoading }] = useSignupMutation();

const handleSignup = async (data) => {
  const response = await signup(data).unwrap();
  // Handle success
};
```

### Logout
```tsx
import { useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';

const dispatch = useAppDispatch();

const handleLogout = () => {
  dispatch(logout());
  // Redirect to login
};
```

### Access User Info
```tsx
import { useAppSelector } from '../../app/hooks';

const { user, isAuthenticated, token } = useAppSelector((state) => state.auth);
```

## Validation Schemas

### Login Schema
- username: min 3 characters
- password: min 6 characters

### Signup Schema
- username: 3-50 characters, alphanumeric with underscores/hyphens
- email: valid email format
- password: 6-100 characters
- confirmPassword: must match password
- fullName: 2-100 characters

## API Endpoints

- `POST /auth/signin` - Login
- `POST /auth/signup` - Signup
- `GET /auth/me` - Get current user (protected)
- `POST /auth/logout` - Logout (protected)

## State Structure

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
```

## User Roles

- `ROLE_SUPER_ADMIN`: Full system access
- `ROLE_STAFF`: Limited access based on permissions
