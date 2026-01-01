# Quotations Feature

This module implements the quotation management functionality for the Kitchen CRM system, including API integration, state management, and utility functions.

## Overview

The quotations feature provides comprehensive functionality for:
- Creating and managing quotations
- Complex pricing calculations with margin and tax
- Category-wise price breakdown (Cabinets, Doors, Accessories, Lighting)
- PDF generation and download
- Status management and workflow
- Integration with customers and products

## Files Structure

```
src/features/quotations/
├── types.ts                    # TypeScript type definitions
├── quotationsAPI.ts            # RTK Query API endpoints
├── quotationsSlice.ts          # Redux state management
├── utils/
│   ├── pricingCalculations.ts  # Pricing calculation utilities
│   └── quotationHelpers.ts     # Helper functions
├── index.ts                    # Feature exports
└── README.md                   # This file
```

## API Endpoints

The quotations API integrates with the following backend endpoints:

- `GET /api/v1/quotations` - List quotations with filters
- `GET /api/v1/quotations/statistics` - Get quotation statistics
- `GET /api/v1/quotations/{id}` - Get quotation by ID
- `GET /api/v1/quotations/customer/{customerId}` - Get quotations by customer
- `GET /api/v1/quotations/search` - Search quotations
- `POST /api/v1/quotations` - Create quotation
- `PUT /api/v1/quotations/{id}` - Update quotation
- `DELETE /api/v1/quotations/{id}` - Delete quotation (SUPER_ADMIN only)
- `PATCH /api/v1/quotations/{id}/status` - Update status (SUPER_ADMIN only)
- `POST /api/v1/quotations/{id}/duplicate` - Duplicate quotation
- `GET /api/v1/quotations/{id}/pdf` - Download quotation PDF
- `GET /api/v1/quotations/{id}/bill/pdf` - Download bill PDF (SUPER_ADMIN only)

## Types

### Core Types

- `Quotation` - Main quotation entity
- `QuotationSummary` - Summary for list views
- `QuotationStatus` - Enum for quotation statuses
- `CreateQuotationRequest` - Request payload for creating quotations
- `UpdateQuotationRequest` - Request payload for updating quotations

### Line Item Types

- `QuotationAccessory` - Accessory line items
- `QuotationCabinet` - Cabinet line items
- `QuotationDoor` - Door line items
- `QuotationLighting` - Lighting line items

### Pricing Types

- `QuotationTotals` - Complete pricing breakdown
- `CategoryTotals` - Category-wise totals (base, margin, tax, final)

## State Management

The quotations slice manages:

- `quotations` - List of quotation summaries
- `currentQuotation` - Currently selected quotation
- `statistics` - Quotation statistics
- `filters` - Current filter settings
- `pagination` - Pagination state
- `loading` - Loading states for different operations
- `error` - Error messages

### Actions

- `setQuotations` - Set quotations list
- `setCurrentQuotation` - Set current quotation
- `updateFilters` - Update filter settings
- `setLoading` - Set loading state
- `setError` - Set error message
- Optimistic updates for create/update/delete operations

## Pricing Calculations

The pricing system calculates:

1. **Base Totals**: Sum of all line items by category
2. **Subtotal**: Base totals + transportation + installation
3. **Margin Amount**: Subtotal × margin percentage
4. **Tax Amount**: (Subtotal + margin) × tax percentage
5. **Total Amount**: Subtotal + margin + tax

### Category-wise Calculations

Each category (Cabinets, Doors, Accessories, Lighting) has:
- Base total
- Margin amount
- Tax amount
- Final total

## Utility Functions

### Pricing Calculations (`pricingCalculations.ts`)

- `calculateQuotationTotals()` - Main pricing calculation
- `calculateLineItemTotal()` - Individual item totals
- `calculateSquareFootage()` - Area calculations
- `formatCurrency()` - Currency formatting
- `validateQuotationForm()` - Form validation

### Helper Functions (`quotationHelpers.ts`)

- `sortQuotations()` - Sort quotations by criteria
- `filterQuotations()` - Filter quotations
- `searchQuotations()` - Text search
- `getQuotationStatusCount()` - Status statistics
- `getRecentQuotations()` - Recent quotations
- `getExpiredQuotations()` - Expired quotations
- `calculateQuotationStatistics()` - Statistics calculation

## Usage Examples

### Using RTK Query Hooks

```typescript
import { 
  useGetQuotationsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation 
} from '../features/quotations';

// Get quotations with filters
const { data: quotations, isLoading } = useGetQuotationsQuery({
  page: 0,
  size: 10,
  status: 'DRAFT'
});

// Create quotation
const [createQuotation, { isLoading: isCreating }] = useCreateQuotationMutation();

const handleCreate = async (quotationData) => {
  try {
    await createQuotation(quotationData).unwrap();
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

### Using Redux State

```typescript
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectQuotations, 
  selectQuotationLoading,
  updateFilters 
} from '../features/quotations';

const QuotationsList = () => {
  const quotations = useSelector(selectQuotations);
  const loading = useSelector(selectQuotationLoading);
  const dispatch = useDispatch();

  const handleFilterChange = (newFilters) => {
    dispatch(updateFilters(newFilters));
  };

  return (
    // Component JSX
  );
};
```

### Pricing Calculations

```typescript
import { calculateQuotationTotals } from '../features/quotations';

const quotationData = {
  customerId: 1,
  transportationPrice: 1000,
  installationPrice: 2000,
  marginPercentage: 15,
  taxPercentage: 18,
  accessories: [...],
  cabinets: [...],
  doors: [...],
  lighting: [...]
};

const totals = calculateQuotationTotals(quotationData);
console.log(totals.totalAmount); // Final total
console.log(totals.cabinets.final); // Cabinets final total
```

## Integration Points

### With Customers
- Quotations are linked to customers via `customerId`
- Customer information is included in quotation summaries
- Customer-specific quotation lists

### With Products
- Line items reference product entities
- Product information (name, brand, material) is included
- Custom items can be added with custom names

### With Projects
- Approved quotations can be converted to projects
- Project references are maintained in quotations

## Status Workflow

1. **DRAFT** - Being created, can be edited
2. **SENT** - Sent to customer, can be approved/rejected
3. **APPROVED** - Approved by customer, can be converted to project
4. **REJECTED** - Rejected by customer
5. **REVISED** - Revisions made, can be edited

## Permissions

- **STAFF**: Can create, edit, view quotations
- **SUPER_ADMIN**: Can delete quotations, update status, download bill PDFs

## Error Handling

- API errors are handled by RTK Query
- Form validation errors are displayed to users
- Network errors are handled gracefully
- Token expiration triggers re-authentication

## Performance Considerations

- Quotations are cached by RTK Query
- Pagination reduces data transfer
- Optimistic updates improve UX
- Debounced search reduces API calls

## Future Enhancements

- Real-time quotation updates
- Advanced reporting and analytics
- Bulk operations
- Template system for common quotations
- Integration with external pricing APIs
