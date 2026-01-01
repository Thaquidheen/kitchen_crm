/**
 * StaffPage
 * Main page for displaying and managing staff members
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGetStaffQuery, useDeleteStaffMutation } from '@/features/staff/staffAPI';
import { Plus, Search, Users, Trash2, Edit, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Staff } from '@/features/staff/types';
import StaffFormModal from '@/features/staff/components/StaffFormModal';
import { StatusBadge } from '@/components/shared/StatusBadge';

export function StaffPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const { data: staffList = [], isLoading } = useGetStaffQuery();
  const [deleteStaff] = useDeleteStaffMutation();

  const handleAddStaff = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setIsModalOpen(true);
  };

  const handleDeleteStaff = async (id: number, staffName: string) => {
    if (!confirm(`Are you sure you want to deactivate ${staffName}?`)) return;
    
    try {
      await deleteStaff(id).unwrap();
      toast.success('Staff deactivated successfully');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to deactivate staff');
    }
  };

  const filteredStaff = searchTerm
    ? staffList.filter((staff: Staff) => 
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : staffList;

  const activeStaffCount = staffList.filter((s: Staff) => s.active).length;
  const inactiveStaffCount = staffList.filter((s: Staff) => !s.active).length;

  return (
    <div className="min-h-screen bg-background-900 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-900">Staff Management</h1>
              <p className="text-xs sm:text-sm text-text-600 mt-1">Manage staff members and their access</p>
            </div>
          </div>

          <Button variant="primary" size="sm" onClick={handleAddStaff} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Staff</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-text-600" />
            <Input
              placeholder="Search staff by name, email, or phone..."
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
                <p className="text-xs sm:text-sm text-text-600">Total Staff</p>
                <div className="text-xl sm:text-2xl font-bold text-text-900 mt-1">
                  {isLoading ? (
                    <div className="h-6 sm:h-8 w-20 sm:w-24 bg-background-700 rounded animate-pulse" />
                  ) : (
                    staffList.length
                  )}
                </div>
              </div>
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-info flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-text-600">Active Staff</p>
                <div className="text-xl sm:text-2xl font-bold text-success mt-1">
                  {isLoading ? (
                    <div className="h-6 sm:h-8 w-20 sm:w-24 bg-background-700 rounded animate-pulse" />
                  ) : (
                    activeStaffCount
                  )}
                </div>
              </div>
              <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-success flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-text-600">Inactive Staff</p>
                <div className="text-xl sm:text-2xl font-bold text-error mt-1">
                  {isLoading ? (
                    <div className="h-6 sm:h-8 w-20 sm:w-24 bg-background-700 rounded animate-pulse" />
                  ) : (
                    inactiveStaffCount
                  )}
                </div>
              </div>
              <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-error flex-shrink-0" />
            </div>
          </Card>
        </div>
      </div>

      {/* Staff List */}
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
        <h2 className="text-lg sm:text-xl font-bold text-text-900 mb-3 sm:mb-4">All Staff Members</h2>
        
        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 sm:h-24 bg-background-700 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Users className="h-12 w-12 sm:h-16 sm:w-16 text-text-600 mx-auto mb-3 sm:mb-4" />
            <p className="text-text-600 text-base sm:text-lg">
              {searchTerm ? 'No staff found matching your search' : 'No staff members found'}
            </p>
            {searchTerm && (
              <p className="text-text-600 text-sm mt-2">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredStaff.map((staff: Staff) => (
              <Card key={staff.id} className="p-3 sm:p-4 bg-background-700 border-background-600">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-text-900 break-words">{staff.name}</h3>
                      <StatusBadge status={staff.active ? 'active' : 'inactive'} />
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 text-text-600">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <span className="break-all">{staff.email}</span>
                      </div>
                      {staff.phoneNumber && (
                        <div className="flex items-center gap-1 text-text-600">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{staff.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => handleEditStaff(staff)} className="flex-1 sm:flex-none">
                      <Edit className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDeleteStaff(staff.id, staff.name)}
                      disabled={!staff.active}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Staff Form Modal */}
      {isModalOpen && (
        <StaffFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingStaff(null);
          }}
          staff={editingStaff}
        />
      )}
    </div>
  );
}

export default StaffPage;






