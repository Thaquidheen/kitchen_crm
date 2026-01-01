/**
 * VendorsPage
 * Main page for displaying and managing vendors
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGetVendorsQuery, useDeleteVendorMutation } from '@/features/vendors/vendorsAPI';
import { Plus, Search, Users, Trash2, Edit, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Vendor } from '@/features/vendors/vendorsAPI';
import VendorFormModal from '@/features/vendors/components/VendorFormModal';

export function VendorsPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const { data, isLoading } = useGetVendorsQuery({ page, size: 10, sortBy: 'vendorName', sortDir: 'asc' });
  const [deleteVendor] = useDeleteVendorMutation();

  const vendors = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 0;

  const handleAddVendor = () => {
    setEditingVendor(null);
    setIsModalOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsModalOpen(true);
  };

  const handleDeleteVendor = async (id: number, vendorName: string) => {
    if (!confirm(`Are you sure you want to delete ${vendorName}?`)) return;
    
    try {
      await deleteVendor(id).unwrap();
      toast.success('Vendor deleted successfully');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete vendor');
    }
  };

  const filteredVendors = searchTerm
    ? vendors.filter((v: Vendor) => 
        v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : vendors;

  return (
    <div className="min-h-screen bg-background-900 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Store className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-900">Vendors</h1>
              <p className="text-xs sm:text-sm text-text-600 mt-1">Manage your vendors and suppliers</p>
            </div>
          </div>

          <Button variant="primary" size="sm" onClick={handleAddVendor} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Vendor</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-text-600" />
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-text-600">Total Vendors</p>
                <div className="text-xl sm:text-2xl font-bold text-text-900 mt-1">
                  {isLoading ? (
                    <div className="h-6 sm:h-8 w-20 sm:w-24 bg-background-700 rounded animate-pulse" />
                  ) : (
                    totalElements
                  )}
                </div>
              </div>
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-info flex-shrink-0" />
            </div>
          </Card>
        </div>
      </div>

      {/* Vendor List */}
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
        <h2 className="text-lg sm:text-xl font-bold text-text-900 mb-3 sm:mb-4">All Vendors</h2>
        
        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 sm:h-24 bg-background-700 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Users className="h-12 w-12 sm:h-16 sm:w-16 text-text-600 mx-auto mb-3 sm:mb-4" />
            <p className="text-text-600 text-base sm:text-lg">No vendors found</p>
            {searchTerm && (
              <p className="text-text-600 text-sm mt-2">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredVendors.map((vendor: Vendor) => (
              <Card key={vendor.id} className="p-3 sm:p-4 bg-background-700 border-background-600">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-text-900 break-words">{vendor.vendorName}</h3>
                      {!vendor.active && (
                        <span className="px-2 py-1 text-xs font-medium bg-error text-text-900 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <p className="text-text-600">
                        Type: <span className="font-medium text-text-700">{vendor.vendorType.replace('_', ' ')}</span>
                      </p>
                      {vendor.contactPerson && (
                        <p className="text-text-600 break-words">
                          Contact: <span className="text-text-700">{vendor.contactPerson}</span>
                        </p>
                      )}
                      {vendor.phone && (
                        <p className="text-text-600">
                          Phone: <span className="text-text-700">{vendor.phone}</span>
                        </p>
                      )}
                      {vendor.email && (
                        <p className="text-text-600 break-all">
                          Email: <span className="text-text-700">{vendor.email}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => handleEditVendor(vendor)} className="flex-1 sm:flex-none">
                      <Edit className="h-4 w-4 mr-1 sm:mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteVendor(vendor.id, vendor.vendorName)} className="flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2 mt-4 sm:mt-6">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>
                <span className="text-text-700 text-sm">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="w-full sm:w-auto"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Vendor Form Modal */}
      {isModalOpen && (
        <VendorFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingVendor(null);
          }}
          vendor={editingVendor}
        />
      )}
    </div>
  );
}

export default VendorsPage;






