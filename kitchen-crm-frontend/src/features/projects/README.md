# Projects Feature

This module implements the project management functionality for the Kitchen CRM system, including API integration, state management, and quotation conversion capabilities.

## Overview

The projects feature provides comprehensive functionality for:
- Creating and managing customer projects
- Converting approved quotations to projects
- Tracking project financials and status
- Project statistics and reporting
- Integration with customers and quotations

## Files Structure

```
src/features/projects/
├── types.ts                    # TypeScript type definitions
├── projectsAPI.ts              # RTK Query API endpoints
├── projectsSlice.ts            # Redux state management
├── index.ts                    # Feature exports
└── README.md                   # This file
```

## API Endpoints

The projects API integrates with the following backend endpoints:

- `GET /api/v1/projects` - List projects with filters
- `GET /api/v1/projects/statistics` - Get project statistics
- `GET /api/v1/projects/{id}` - Get project by ID
- `GET /api/v1/projects/customer/{customerId}` - Get projects by customer
- `GET /api/v1/projects/{id}/financial-summary` - Get project financial summary
- `POST /api/v1/projects` - Create project
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project (SUPER_ADMIN only)
- `PATCH /api/v1/projects/{id}/status` - Update project status
- `POST /api/v1/projects/quotation/{quotationId}/convert` - Convert quotation to project

## Types

### Core Types

- `Project` - Main project entity
- `ProjectSummary` - Summary for list views
- `ProjectStatus` - Project status enum
- `CreateProjectRequest` - Request for creating projects
- `UpdateProjectRequest` - Request for updating projects
- `ProjectFilters` - Filtering options
- `ProjectStatistics` - Statistics data
- `ProjectFinancialSummary` - Financial summary data
- `ConvertQuotationToProjectRequest` - Quotation conversion request

### Project Status

Projects can have the following statuses:
- `ACTIVE` - Project is active and in progress
- `COMPLETED` - Project has been completed
- `CANCELLED` - Project has been cancelled
- `ON_HOLD` - Project is temporarily on hold
- `IN_PROGRESS` - Project is actively being worked on

## Usage Examples

### Basic Project Operations

```typescript
import { 
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useConvertQuotationToProjectMutation
} from '../features/projects';

// Get projects with filters
const { data: projects, isLoading } = useGetProjectsQuery({
  customerId: 1,
  status: 'ACTIVE',
  page: 0,
  size: 10
});

// Create a new project
const [createProject] = useCreateProjectMutation();
const newProject = await createProject({
  customerId: 1,
  projectName: 'Kitchen Renovation',
  projectDescription: 'Complete kitchen renovation project',
  startDate: '2024-01-01',
  expectedCompletionDate: '2024-03-01'
});

// Convert quotation to project
const [convertQuotation] = useConvertQuotationToProjectMutation();
const project = await convertQuotation({ quotationId: 123 });
```

### Using Redux State

```typescript
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectProjects, 
  selectCurrentProject,
  selectProjectLoading,
  setCurrentProject 
} from '../features/projects';

const ProjectsList = () => {
  const dispatch = useDispatch();
  const projects = useSelector(selectProjects);
  const currentProject = useSelector(selectCurrentProject);
  const { isLoading } = useSelector(selectProjectLoading);

  const handleSelectProject = (project) => {
    dispatch(setCurrentProject(project));
  };

  // ... component logic
};
```

### Quotation Conversion

```typescript
import { useQuotationConversion } from '../features/quotations/utils/quotationConversion';

const QuotationCard = ({ quotation }) => {
  const { convertToProject, isConverting, conversionError } = useQuotationConversion();

  const handleConvert = async () => {
    try {
      await convertToProject(quotation.id);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      <button 
        onClick={handleConvert}
        disabled={isConverting || !canConvertToProject(quotation)}
      >
        {isConverting ? 'Converting...' : 'Convert to Project'}
      </button>
    </div>
  );
};
```

## Integration with Other Features

### Customers
Projects are linked to customers and can be filtered by customer ID.

### Quotations
Approved quotations can be converted to projects, maintaining the relationship between the two entities.

### Dashboard
Project statistics are integrated into the dashboard for overview reporting.

## State Management

The projects feature uses Redux Toolkit with RTK Query for:
- Caching API responses
- Automatic refetching
- Optimistic updates
- Error handling
- Loading states

## Error Handling

All API operations include proper error handling:
- Network errors
- Validation errors
- Authorization errors
- Business logic errors

## Performance Considerations

- Projects are paginated for large datasets
- RTK Query provides automatic caching
- Optimistic updates for better UX
- Selective re-rendering with proper selectors
