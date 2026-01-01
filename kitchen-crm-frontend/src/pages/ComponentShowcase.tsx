/**
 * Component Showcase Page
 * Demonstration of all UI components with different states
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mail, Lock, Save, X, ArrowRight } from 'lucide-react';
import { ROUTES } from '../routes/routes.config';
import { AppLayout } from '../components/layout';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Select,
  TextArea,
  Checkbox,
  Radio,
  Switch,
} from '../components/ui';

const ComponentShowcase = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [switchValue, setSwitchValue] = useState(false);
  const [selectValue, setSelectValue] = useState('');

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4 (Disabled)', disabled: true },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-white-900 mb-2">
            UI Components Showcase
          </h1>
          <p className="text-white-700">
            Sprint 2.1: Base UI Components - Black/Red/White Theme
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Buttons Card */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-heading font-semibold text-white-900">
                Buttons
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {/* Button Variants */}
                <div>
                  <p className="text-sm text-white-700 mb-2">Variants:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="danger">Danger</Button>
                    <Button variant="ghost">Ghost</Button>
                  </div>
                </div>

                {/* Button Sizes */}
                <div>
                  <p className="text-sm text-white-700 mb-2">Sizes:</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </div>

                {/* Button with Icons */}
                <div>
                  <p className="text-sm text-white-700 mb-2">With Icons:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button leftIcon={<Save size={18} />}>Save</Button>
                    <Button variant="secondary" rightIcon={<Search size={18} />}>
                      Search
                    </Button>
                  </div>
                </div>

                {/* Button States */}
                <div>
                  <p className="text-sm text-white-700 mb-2">States:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      isLoading={isLoading}
                      onClick={() => {
                        setIsLoading(true);
                        setTimeout(() => setIsLoading(false), 2000);
                      }}
                    >
                      Click to Load
                    </Button>
                    <Button disabled>Disabled</Button>
                  </div>
                </div>

                {/* Full Width */}
                <div>
                  <p className="text-sm text-white-700 mb-2">Full Width:</p>
                  <Button fullWidth>Full Width Button</Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Input Fields Card */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-heading font-semibold text-white-900">
                Input Fields
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Input label="Text Input" placeholder="Enter text..." />
                <Input
                  label="Email Input"
                  type="email"
                  placeholder="Enter email..."
                  leftIcon={<Mail size={18} />}
                />
                <Input
                  label="Password Input"
                  type="password"
                  placeholder="Enter password..."
                  leftIcon={<Lock size={18} />}
                />
                <Input
                  label="Number Input"
                  type="number"
                  placeholder="Enter number..."
                />
                <Input
                  label="With Error"
                  placeholder="This has an error"
                  error="This field is required"
                />
                <Input
                  label="With Helper Text"
                  placeholder="With helper text"
                  helperText="This is a helper text"
                />
                <Input label="Disabled" placeholder="Disabled input" disabled />
              </div>
            </CardBody>
          </Card>

          {/* Select & TextArea Card */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-heading font-semibold text-white-900">
                Select & TextArea
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Select
                  label="Select Dropdown"
                  options={selectOptions}
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                />
                <Select
                  label="Select with Error"
                  options={selectOptions}
                  error="Please select an option"
                />
                <TextArea
                  label="Text Area"
                  placeholder="Enter your message..."
                  rows={4}
                />
                <TextArea
                  label="Text Area (No Resize)"
                  placeholder="This textarea cannot be resized..."
                  resize={false}
                  rows={3}
                />
                <TextArea
                  label="With Error"
                  placeholder="This has an error"
                  error="Message is required"
                />
              </div>
            </CardBody>
          </Card>

          {/* Checkbox, Radio & Switch Card */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-heading font-semibold text-white-900">
                Checkbox, Radio & Switch
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                {/* Checkboxes */}
                <div>
                  <p className="text-sm text-white-700 mb-3">Checkboxes:</p>
                  <div className="space-y-2">
                    <Checkbox
                      label="Accept terms and conditions"
                      checked={checkboxValue}
                      onChange={(e) => setCheckboxValue(e.target.checked)}
                    />
                    <Checkbox label="Subscribe to newsletter" />
                    <Checkbox label="Disabled checkbox" disabled />
                    <Checkbox
                      label="With error"
                      error="You must accept this"
                    />
                  </div>
                </div>

                {/* Radio Buttons */}
                <div>
                  <p className="text-sm text-white-700 mb-3">Radio Buttons:</p>
                  <div className="space-y-2">
                    <Radio
                      name="radio-group"
                      label="Option 1"
                      value="option1"
                      checked={radioValue === 'option1'}
                      onChange={(e) => setRadioValue(e.target.value)}
                    />
                    <Radio
                      name="radio-group"
                      label="Option 2"
                      value="option2"
                      checked={radioValue === 'option2'}
                      onChange={(e) => setRadioValue(e.target.value)}
                    />
                    <Radio
                      name="radio-group"
                      label="Option 3"
                      value="option3"
                      checked={radioValue === 'option3'}
                      onChange={(e) => setRadioValue(e.target.value)}
                    />
                    <Radio label="Disabled option" disabled />
                  </div>
                </div>

                {/* Switches */}
                <div>
                  <p className="text-sm text-white-700 mb-3">Switches:</p>
                  <div className="space-y-2">
                    <Switch
                      label="Enable notifications"
                      checked={switchValue}
                      onChange={(e) => setSwitchValue(e.target.checked)}
                    />
                    <Switch label="Dark mode" labelPosition="left" />
                    <Switch label="Disabled switch" disabled />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Card with Footer */}
          <Card className="lg:col-span-2">
            <CardHeader
              actions={
                <Button size="sm" variant="ghost">
                  Action
                </Button>
              }
            >
              <h2 className="text-xl font-heading font-semibold text-white-900">
                Card with Header, Body & Footer
              </h2>
            </CardHeader>
            <CardBody>
              <p className="text-white-700">
                This is a card component with a header (including actions), body, and
                footer. It demonstrates the complete card structure with all sections.
              </p>
            </CardBody>
            <CardFooter>
              <Button variant="ghost">Cancel</Button>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Status */}
        <div className="mt-8">
          <Card bordered>
            <div className="text-center">
              <h2 className="text-xl font-heading font-semibold text-white-900 mb-2">
                ✅ Sprint 2.1: Base UI Components Complete!
              </h2>
              <p className="text-white-700 mb-4">
                All 8 base components are implemented with theme colors, validation
                states, and full accessibility.
              </p>
              <Link
                to={ROUTES.COMPONENTS_ADVANCED}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white-900 font-semibold rounded-lg transition-all"
              >
                View Advanced Components
                <ArrowRight size={18} />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ComponentShowcase;
