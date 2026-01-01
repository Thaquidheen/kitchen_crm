# Payments Feature

This module implements the payment management functionality for the Kitchen CRM system, including API integration, state management, and validation logic.

## Features

- **Payment API Integration**: Complete CRUD operations for payments
- **State Management**: Redux slice for payment state management
- **Validation Logic**: Comprehensive validation including balance checks
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Structure

```
src/features/payments/
├── types.ts                    # Type definitions and interfaces
├── paymentApi.ts              # RTK Query API integration
├── paymentsSlice.ts           # Redux state management
├── utils/
│   ├── paymentValidation.ts    # Validation logic and balance checks
│   └── paymentUtils.ts        # Utility functions and constants
└── index.ts                   # Module exports
```

## API Endpoints

The payment API integrates with the following backend endpoints:

- `GET /api/v1/payments` - Get all payments with filters
- `GET /api/v1/payments/{id}` - Get payment by ID
- `GET /api/v1/payments/project/{projectId}` - Get payments by project
- `GET /api/v1/payments/project/{projectId}/summary` - Get project payment summary
- `GET /api/v1/payments/statistics` - Get payment statistics
- `POST /api/v1/payments` - Create payment
- `POST /api/v1/payments/project/{projectId}` - Add payment to project
- `PUT /api/v1/payments/{id}` - Update payment
- `DELETE /api/v1/payments/{id}` - Delete payment

## Types

### Core Types

- `Payment` - Complete payment entity
- `PaymentCreateRequest` - Payment creation request
- `PaymentUpdateRequest` - Payment update request
- `PaymentSummary` - Payment summary for lists
- `ProjectPaymentSummary` - Project payment summary
- `PaymentStatistics` - Payment statistics data

### Enums

- `PaymentMethod` - Payment methods (CASH, ACCOUNT_TRANSFER, CHEQUE, CARD, UPI, NEFT, RTGS)
- `PaymentStatus` - Payment statuses (PENDING, COMPLETED, FAILED, REFUNDED)

## State Management

The payments slice manages:

- Payment list and pagination
- Current payment being viewed/edited
- Form state and validation
- Project-specific payments
- Loading and error states
- Selection state for bulk operations
- Statistics data

## Validation Logic

### PaymentValidator Class

Provides comprehensive validation including:

- **Required Field Validation**: Project, amount, payment method, date
- **Amount Validation**: Positive numbers, balance checks
- **Date Validation**: No future dates, reasonable past dates
- **Reference Number Validation**: Format validation based on payment method
- **Balance Validation**: Ensures payment doesn't exceed remaining balance

### Key Validation Methods

- `validatePaymentForm()` - Complete form validation
- `validatePaymentFormFields()` - Field-specific validation
- `validatePaymentAmount()` - Amount validation against project balance
- `requiresReferenceNumber()` - Check if reference number is required
- `isValidReferenceNumber()` - Validate reference number format

## Utility Functions

### PaymentUtils Class

Provides utility functions for:

- Reference number generation
- Statistics calculation
- Amount formatting
- Payment method/status info
- Input validation

### Constants

- `PAYMENT_METHOD_OPTIONS` - Payment method display options
- `PAYMENT_STATUS_OPTIONS` - Payment status display options
- `PAYMENT_CONSTANTS` - Validation constants
- `PAYMENT_FORMATTERS` - Formatting functions

## Usage Examples

### Basic API Usage

```typescript
import { useGetPaymentsQuery, useCreatePaymentMutation } from '../features/payments';

// Get payments with filters
const { data: payments, isLoading } = useGetPaymentsQuery({
  projectId: 123,
  paymentStatus: PaymentStatus.COMPLETED,
  page: 0,
  size: 10
});

// Create payment
const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();
```

### State Management

```typescript
import { useDispatch, useSelector } from 'react-redux';
import { setPaymentForm, setFilters } from '../features/payments';

const dispatch = useDispatch();
const { paymentForm, filters } = useSelector(state => state.payments);

// Update form
dispatch(setPaymentForm({ amount: '5000' }));

// Update filters
dispatch(setFilters({ paymentMethod: PaymentMethod.CASH }));
```

### Validation

```typescript
import { PaymentValidator } from '../features/payments';

const validation = PaymentValidator.validatePaymentForm(formData, projectSummary);
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}
```

## Integration

The payments feature is integrated into the main application through:

1. **Store Configuration**: Added to Redux store in `src/app/store.ts`
2. **API Endpoints**: Configured in `src/services/endpoints.ts`
3. **Routes**: Payment routes defined in `src/routes/routes.config.ts`

## Backend Compatibility

This frontend implementation is fully compatible with the backend payment system:

- **Entity Mapping**: Frontend types match backend DTOs
- **API Contract**: API calls match backend controller endpoints
- **Validation**: Frontend validation mirrors backend validation rules
- **Error Handling**: Proper error response handling

## Future Enhancements

- Payment receipt generation
- Payment history tracking
- Bulk payment operations
- Payment analytics dashboard
- Integration with accounting systems
