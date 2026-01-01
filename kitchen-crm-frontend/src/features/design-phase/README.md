# Design Phase Feature

This module implements the design phase management functionality for the Kitchen CRM system, including API integration, state management, and workflow management.

## Features

- **Design Phase API Integration**: Complete CRUD operations for design phases
- **State Management**: Redux slice for design phase state management
- **Workflow Management**: Design workflow tracking and progress management
- **Meeting Management**: Meeting scheduling and completion tracking
- **Client Communication**: Design submission and feedback handling
- **File Management**: Design file upload and management
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Structure

```
src/features/design-phase/
├── types.ts                    # Type definitions and interfaces
├── designPhaseApi.ts          # RTK Query API integration
├── designPhaseSlice.ts        # Redux state management
├── utils/
│   └── designPhaseUtils.ts    # Utility functions and constants
├── index.ts                   # Module exports
└── README.md                  # Documentation
```

## API Endpoints

The design phase API integrates with the following backend endpoints:

- `GET /api/v1/design-phase` - Get all design phases with filters
- `GET /api/v1/design-phase/customer/{customerId}` - Get design phase by customer
- `GET /api/v1/design-phase/status/{status}` - Get design phases by status
- `GET /api/v1/design-phase/designer/{designer}` - Get design phases by designer
- `GET /api/v1/design-phase/meetings/upcoming` - Get upcoming meetings
- `GET /api/v1/design-phase/statistics` - Get design phase statistics
- `POST /api/v1/design-phase` - Create design phase
- `PUT /api/v1/design-phase/customer/{customerId}` - Update design phase
- `POST /api/v1/design-phase/customer/{customerId}/submit-to-client` - Submit design to client
- `POST /api/v1/design-phase/customer/{customerId}/client-feedback` - Record client feedback
- `POST /api/v1/design-phase/customer/{customerId}/schedule-meeting` - Schedule meeting
- `POST /api/v1/design-phase/customer/{customerId}/complete-meeting` - Complete meeting
- `POST /api/v1/design-phase/customer/{customerId}/freeze-amount` - Freeze design amount
- `POST /api/v1/design-phase/customer/{customerId}/create-group` - Create client group
- `PUT /api/v1/design-phase/customer/{customerId}/status` - Update design status
- `POST /api/v1/design-phase/customer/{customerId}/approve` - Approve design

## Types

### Core Types

- `DesignPhase` - Complete design phase entity
- `DesignPhaseCreateRequest` - Design phase creation request
- `DesignPhaseUpdateRequest` - Design phase update request
- `DesignSubmissionRequest` - Design submission request
- `ClientFeedbackRequest` - Client feedback request
- `MeetingScheduleRequest` - Meeting schedule request
- `DesignPhaseStatistics` - Design phase statistics data

### Enums

- `DesignStatus` - Design statuses (PLANNING, IN_PROGRESS, SUBMITTED, FEEDBACK_RECEIVED, REVISION_REQUIRED, APPROVED, FROZEN, CANCELLED)

### Workflow Types

- `DesignWorkflow` - Design workflow management
- `DesignWorkflowStep` - Individual workflow steps
- `UpcomingMeeting` - Upcoming meeting information
- `DesignFile` - Design file management

## State Management

The design phase slice manages:

- Design phase list and pagination
- Current design phase being viewed/edited
- Form state and validation
- Customer-specific design phases
- Loading and error states
- Selection state for bulk operations
- Statistics data
- Workflow state
- Upcoming meetings
- File management
- Meeting, feedback, and submission forms

## Workflow Management

### Design Workflow Steps

1. **Requirements Gathering** - Collect and analyze client requirements
2. **Design Planning** - Create initial design plan and layout
3. **Design Creation** - Create detailed design drawings
4. **Internal Review** - Internal team review and approval
5. **Client Submission** - Submit design to client for review
6. **Client Feedback** - Collect and process client feedback
7. **Design Revision** - Implement client feedback and revisions
8. **Client Approval** - Obtain final client approval
9. **Design Freeze** - Freeze design and prepare for production

### Progress Tracking

- Overall progress calculation based on status and completion percentage
- Status-based progress mapping
- Estimated completion time calculation
- Priority level determination based on status and age

## Utility Functions

### DesignPhaseUtils Class

Provides utility functions for:

- Design status information and formatting
- Progress calculation and tracking
- Workflow step management
- Validation and form handling
- Date and currency formatting
- Priority level calculation

### Constants

- `DESIGN_STATUS_OPTIONS` - Design status display options
- `DESIGNER_OPTIONS` - Available designers
- `DESIGN_PHASE_CONSTANTS` - Validation and limit constants
- `DESIGN_PHASE_FORMATTERS` - Formatting functions
- `DESIGN_WORKFLOW_STEPS` - Workflow step definitions

## Usage Examples

### Basic API Usage

```typescript
import { useGetDesignPhaseByCustomerQuery, useCreateDesignPhaseMutation } from '../features/design-phase';

// Get design phase by customer
const { data: designPhase, isLoading } = useGetDesignPhaseByCustomerQuery(customerId);

// Create design phase
const [createDesignPhase, { isLoading: isCreating }] = useCreateDesignPhaseMutation();
```

### State Management

```typescript
import { useDispatch, useSelector } from 'react-redux';
import { setDesignPhaseForm, setFilters } from '../features/design-phase';

const dispatch = useDispatch();
const { designPhaseForm, filters } = useSelector(state => state.designPhase);

// Update form
dispatch(setDesignPhaseForm({ designRequirements: 'Modern kitchen design' }));

// Update filters
dispatch(setFilters({ designStatus: DesignStatus.IN_PROGRESS }));
```

### Workflow Management

```typescript
import { DesignPhaseUtils } from '../features/design-phase';

// Calculate progress
const progress = DesignPhaseUtils.calculateOverallProgress(designPhase);

// Check if design can be frozen
const canFreeze = DesignPhaseUtils.canFreezeDesign(designPhase);

// Get next workflow step
const nextStep = DesignPhaseUtils.getNextWorkflowStep(designPhase.designStatus);
```

### Meeting Management

```typescript
import { useScheduleMeetingMutation, useCompleteMeetingMutation } from '../features/design-phase';

// Schedule meeting
const [scheduleMeeting] = useScheduleMeetingMutation();
await scheduleMeeting({
  customerId,
  meetingData: {
    meetingDateTime: '2024-01-15T10:00:00',
    meetingPurpose: 'Design review',
    meetingLocation: 'Office',
    attendees: 'Client, Designer'
  }
});

// Complete meeting
const [completeMeeting] = useCompleteMeetingMutation();
await completeMeeting({
  customerId,
  meetingNotes: 'Client approved design with minor changes'
});
```

## Integration

The design phase feature is integrated into the main application through:

1. **Store Configuration**: Added to Redux store in `src/app/store.ts`
2. **API Endpoints**: Configured in `src/services/endpoints.ts`
3. **Routes**: Design phase routes defined in `src/routes/routes.config.ts`

## Backend Compatibility

This frontend implementation is fully compatible with the backend design phase system:

- **Entity Mapping**: Frontend types match backend DTOs
- **API Contract**: API calls match backend controller endpoints
- **Workflow**: Frontend workflow matches backend business logic
- **Error Handling**: Proper error response handling

## Key Features

1. **Complete API Integration** - All design phase endpoints with proper error handling
2. **Comprehensive State Management** - Redux slice with form, list, and workflow state
3. **Workflow Management** - Complete design workflow tracking and progress management
4. **Meeting Management** - Meeting scheduling, completion, and tracking
5. **Client Communication** - Design submission and feedback handling
6. **File Management** - Design file upload and management
7. **Type Safety** - Full TypeScript coverage with proper type definitions
8. **Utility Functions** - Helper functions for formatting, validation, and calculations

## Future Enhancements

- Design collaboration tools
- Real-time notifications
- Design version control
- 3D design integration
- Client portal integration
- Design approval workflows
- Automated status updates
- Design analytics dashboard
