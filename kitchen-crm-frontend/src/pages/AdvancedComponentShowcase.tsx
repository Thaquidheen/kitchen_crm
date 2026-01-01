/**
 * Advanced Component Showcase Page
 * Demonstration of Sprint 2.2 advanced UI components
 */

import { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Settings,
  Edit,
  Trash2,
  User,
  MoreVertical,
  FileText,
  Image,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '../components/layout';
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  Modal,
  ModalBody,
  ModalFooter,
  Badge,
  Tabs,
  Dropdown,
  Spinner,
  Skeleton,
  DatePicker,
  DateRangePicker,
  Button,
} from '../components/ui';

// Sample data for table
interface Person {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
}

const sampleData: Person[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive' },
  { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'Manager', status: 'active' },
  { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'User', status: 'pending' },
];

const AdvancedComponentShowcase = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({ startDate: null, endDate: null });

  // Table columns
  const columnHelper = createColumnHelper<Person>();
  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        const variant = status === 'active' ? 'success' : status === 'inactive' ? 'danger' : 'warning';
        return <Badge variant={variant} dot>{status}</Badge>;
      },
    }),
  ];

  // Tab items
  const tabItems = [
    {
      label: 'Profile',
      icon: <User size={16} />,
      content: (
        <div className="text-white-700">
          <p>Profile settings content goes here...</p>
        </div>
      ),
    },
    {
      label: 'Documents',
      icon: <FileText size={16} />,
      content: (
        <div className="text-white-700">
          <p>Documents content goes here...</p>
        </div>
      ),
    },
    {
      label: 'Media',
      icon: <Image size={16} />,
      content: (
        <div className="text-white-700">
          <p>Media content goes here...</p>
        </div>
      ),
    },
  ];

  // Dropdown items
  const dropdownItems = [
    {
      label: 'Edit',
      icon: <Edit size={16} />,
      onClick: () => toast.success('Edit clicked'),
    },
    {
      label: 'Settings',
      icon: <Settings size={16} />,
      onClick: () => toast.success('Settings clicked'),
    },
    {
      label: 'Delete',
      icon: <Trash2 size={16} />,
      onClick: () => toast.error('Delete clicked'),
      danger: true,
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-white-900 mb-2">
            Advanced Components
          </h1>
          <p className="text-white-700">
            Sprint 2.2: Advanced UI Components - Black/Red/White Theme
          </p>
        </div>

        <div className="space-y-6">
          {/* Spinners & Badges */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spinner Card */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-heading font-semibold text-white-900">
                  Spinners
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-white-700 mb-2">Sizes:</p>
                    <div className="flex items-center gap-4">
                      <Spinner size="xs" />
                      <Spinner size="sm" />
                      <Spinner size="md" />
                      <Spinner size="lg" />
                      <Spinner size="xl" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-white-700 mb-2">Variants:</p>
                    <div className="flex items-center gap-4">
                      <Spinner variant="primary" />
                      <Spinner variant="secondary" />
                      <Spinner variant="white" />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Badge Card */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-heading font-semibold text-white-900">
                  Badges
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-white-700 mb-2">Variants:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default">Default</Badge>
                      <Badge variant="primary">Primary</Badge>
                      <Badge variant="success">Success</Badge>
                      <Badge variant="warning">Warning</Badge>
                      <Badge variant="danger">Danger</Badge>
                      <Badge variant="info">Info</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-white-700 mb-2">With Dot:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="success" dot>Active</Badge>
                      <Badge variant="danger" dot>Inactive</Badge>
                      <Badge variant="warning" dot>Pending</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-white-700 mb-2">Sizes:</p>
                    <div className="flex items-center gap-2">
                      <Badge size="sm">Small</Badge>
                      <Badge size="md">Medium</Badge>
                      <Badge size="lg">Large</Badge>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Skeleton Loader */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-heading font-semibold text-white-900">
                Skeleton Loaders
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-white-700 mb-2">Text Lines:</p>
                  <Skeleton variant="text" count={3} />
                </div>
                <div>
                  <p className="text-sm text-white-700 mb-2">Circular:</p>
                  <Skeleton variant="circular" width={64} height={64} />
                </div>
                <div>
                  <p className="text-sm text-white-700 mb-2">Rectangular:</p>
                  <Skeleton variant="rectangular" height={100} />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Modal & Dropdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Modal Card */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-heading font-semibold text-white-900">
                  Modal/Dialog
                </h2>
              </CardHeader>
              <CardBody>
                <Button onClick={() => setIsModalOpen(true)}>
                  Open Modal
                </Button>

                <Modal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  title="Example Modal"
                  size="md"
                >
                  <ModalBody>
                    <p className="text-white-700">
                      This is a modal dialog with a title, body, and footer.
                      It can be closed by clicking the X button or clicking
                      outside the modal.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      toast.success('Saved!');
                      setIsModalOpen(false);
                    }}>
                      Save
                    </Button>
                  </ModalFooter>
                </Modal>
              </CardBody>
            </Card>

            {/* Dropdown Card */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-heading font-semibold text-white-900">
                  Dropdown Menu
                </h2>
              </CardHeader>
              <CardBody>
                <Dropdown
                  trigger={
                    <Button variant="secondary">
                      <MoreVertical size={18} />
                      Actions
                    </Button>
                  }
                  items={dropdownItems}
                />
              </CardBody>
            </Card>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-heading font-semibold text-white-900">
                  DatePicker
                </h2>
              </CardHeader>
              <CardBody>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  helperText="Choose a date from the calendar"
                />
                {selectedDate && (
                  <p className="mt-2 text-sm text-white-700">
                    Selected: {selectedDate.toLocaleDateString()}
                  </p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-heading font-semibold text-white-900">
                  DateRangePicker
                </h2>
              </CardHeader>
              <CardBody>
                <DateRangePicker
                  label="Select Date Range"
                  value={dateRange}
                  onChange={(range) => setDateRange(range)}
                  helperText="Choose start and end dates"
                />
                {(dateRange.startDate || dateRange.endDate) && (
                  <p className="mt-2 text-sm text-white-700">
                    Range: {dateRange.startDate?.toLocaleDateString() || 'Not set'} -{' '}
                    {dateRange.endDate?.toLocaleDateString() || 'Not set'}
                  </p>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Tabs */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-heading font-semibold text-white-900">
                Tabs
              </h2>
            </CardHeader>
            <CardBody>
              <Tabs tabs={tabItems} />
            </CardBody>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-heading font-semibold text-white-900">
                Data Table
              </h2>
            </CardHeader>
            <CardBody>
              <Table
                data={sampleData}
                columns={columns}
                enableSorting
                enablePagination
                pageSize={3}
              />
            </CardBody>
          </Card>

          {/* Status */}
          <Card bordered>
            <div className="text-center">
              <h2 className="text-xl font-heading font-semibold text-white-900 mb-2">
                ✅ Sprint 2.2: Advanced UI Components Complete!
              </h2>
              <p className="text-white-700">
                All 10 advanced components implemented with full functionality and
                accessibility.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdvancedComponentShowcase;
