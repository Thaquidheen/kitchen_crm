import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGetCustomerByIdQuery } from '../../features/customers/customersAPI';
import { CustomerDetail } from '../../features/customers/components/CustomerDetail';
import { CustomerReminders } from '../../features/customers/components/CustomerReminders';

const CustomerDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const customerId = params.id ? Number(params.id) : undefined;

  const { data: customer, isLoading, error } = useGetCustomerByIdQuery(customerId!, {
    skip: !customerId,
  });

  if (!customerId) {
    return (
      <div className="p-4">
        <p className="text-error">Invalid customer ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-background-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-background-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-4">
        <p className="text-error">Failed to load customer details</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 text-error hover:underline"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customers')}
            className="text-text-900 hover:text-primary-500 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-text-900">{customer.name}</h1>
            <p className="text-text-600 text-sm">Customer ID: #{customer.id}</p>
          </div>
        </div>
      </div>

      {/* Customer Detail Component */}
      <CustomerDetail customer={customer} />

      {/* Reminders for this customer */}
      <CustomerReminders customerId={customer.id} />
    </div>
  );
};

export default CustomerDetailPage;
