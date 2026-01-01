# UI Components Library

Sprint 2.1: Base UI Components - Black/Red/White Theme

## Overview

This folder contains all reusable UI components built with React, TypeScript, and TailwindCSS. All components follow the Black/Red/White theme and include:

- **Variant support**: Different visual styles
- **Size options**: Small, medium, large
- **Loading states**: Visual feedback during async operations
- **Disabled states**: Non-interactive states
- **Validation states**: Error messages and helper text
- **Accessibility**: ARIA labels and keyboard navigation

## Components

### 1. Button
Multi-variant button component with icons and loading states.

**Variants:** `primary` | `secondary` | `danger` | `ghost`
**Sizes:** `sm` | `md` | `lg`

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md">
  Click me
</Button>

<Button isLoading leftIcon={<Icon />}>
  Save
</Button>
```

### 2. Card
Container component with optional header, body, and footer sections.

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';

<Card>
  <CardHeader actions={<Button size="sm">Action</Button>}>
    <h2>Card Title</h2>
  </CardHeader>
  <CardBody>
    <p>Card content...</p>
  </CardBody>
  <CardFooter>
    <Button>Submit</Button>
  </CardFooter>
</Card>
```

### 3. Input
Text input field with validation, icons, and helper text.

**Types:** `text` | `email` | `password` | `number`

```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  type="email"
  placeholder="Enter email..."
  leftIcon={<MailIcon />}
  error="Email is required"
  helperText="We'll never share your email"
/>
```

### 4. Select
Dropdown select component with validation.

```tsx
import { Select } from '@/components/ui';

const options = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
];

<Select
  label="Choose option"
  options={options}
  placeholder="Select..."
  error="Selection is required"
/>
```

### 5. TextArea
Multi-line text input with resize control.

```tsx
import { TextArea } from '@/components/ui';

<TextArea
  label="Description"
  rows={4}
  resize={true}
  placeholder="Enter description..."
  error="Description is required"
/>
```

### 6. Checkbox
Checkbox input with label and validation.

```tsx
import { Checkbox } from '@/components/ui';

<Checkbox
  label="Accept terms and conditions"
  checked={isChecked}
  onChange={(e) => setIsChecked(e.target.checked)}
  error="You must accept the terms"
/>
```

### 7. Radio
Radio button input with label.

```tsx
import { Radio } from '@/components/ui';

<Radio
  name="option"
  label="Option 1"
  value="option1"
  checked={value === 'option1'}
  onChange={(e) => setValue(e.target.value)}
/>
```

### 8. Switch
Toggle switch component.

```tsx
import { Switch } from '@/components/ui';

<Switch
  label="Enable notifications"
  labelPosition="right"
  checked={isEnabled}
  onChange={(e) => setIsEnabled(e.target.checked)}
/>
```

## Theme Colors

All components use the Black/Red/White theme:

- **Black**: `#000000` to `#3A3A3A`
- **Red**: `#8B0000` to `#FFCCCC`
- **White**: `#FFFFFF` to `#B5B5B5`

## Common Props

### All Form Components
- `label?: string` - Field label
- `error?: string` - Error message
- `helperText?: string` - Helper text
- `disabled?: boolean` - Disabled state
- `fullWidth?: boolean` - Full width (default: true)

### Input Components
- `leftIcon?: ReactNode` - Icon on the left
- `rightIcon?: ReactNode` - Icon on the right

## Accessibility

All components include:
- Proper ARIA labels
- Focus states with visible rings
- Keyboard navigation support
- Screen reader friendly markup

## Usage Example

```tsx
import { Button, Input, Card, CardHeader, CardBody } from '@/components/ui';
import { Mail } from 'lucide-react';

function MyForm() {
  return (
    <Card>
      <CardHeader>
        <h2>Login Form</h2>
      </CardHeader>
      <CardBody>
        <Input
          label="Email"
          type="email"
          leftIcon={<Mail />}
          placeholder="Enter email..."
        />
        <Button fullWidth variant="primary">
          Sign In
        </Button>
      </CardBody>
    </Card>
  );
}
```

## Component Showcase

Visit `/components` route to see all components with different states and variants.

## Future Enhancements

Sprint 2.2 will add:
- Table component
- Modal/Dialog
- Badge
- Tabs
- Dropdown menu
- Toast notifications (already integrated)
- Spinner/Loader
- Skeleton loader
- DatePicker
- DateRangePicker
