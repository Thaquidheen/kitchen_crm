/**
 * ArchitectsPage
 * Main page for displaying and managing architects
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useGetArchitectsQuery, useDeleteArchitectMutation, useMarkAsVisitedMutation } from '@/features/architects/architectsAPI';
import { Plus, Search, Building2, Trash2, Edit, Phone, User, CheckCircle, Calendar, History, Filter, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { partnerTypeLabel, partnerTypeOf } from '@/features/architects/types';
import type { Architect, PartnerType } from '@/features/architects/types';
import ArchitectFormModal from '@/features/architects/components/ArchitectFormModal';
import ArchitectVisitFormModal from '@/features/architects/components/ArchitectVisitFormModal';
import ArchitectVisitHistory from '@/features/architects/components/ArchitectVisitHistory';
import ArchitectVisitBadge from '@/features/architects/components/ArchitectVisitBadge';

export function ArchitectsPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [visitStatusFilter, setVisitStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'' | PartnerType>('');
  const [sortBy, setSortBy] = useState<string>('architectureName');
  const [sortDir, setSortDir] = useState<string>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingArchitect, setEditingArchitect] = useState<Architect | null>(null);
  const [selectedArchitect, setSelectedArchitect] = useState<Architect | null>(null);

  const { data, isLoading } = useGetArchitectsQuery({
    page,
    size: 10,
    sortBy,
    sortDir,
    visitStatus: visitStatusFilter || undefined,
    partnerType: typeFilter || undefined
  });
  const [deleteArchitect] = useDeleteArchitectMutation();
  const [markAsVisited] = useMarkAsVisitedMutation();

  const architects = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 0;

  const handleAddArchitect = () => {
    setEditingArchitect(null);
    setIsModalOpen(true);
  };

  const handleEditArchitect = (architect: Architect) => {
    setEditingArchitect(architect);
    setIsModalOpen(true);
  };

  const handleDeleteArchitect = async (id: number, architectName: string) => {
    if (!confirm(`Are you sure you want to delete ${architectName}?`)) return;
    
    try {
      await deleteArchitect(id).unwrap();
      toast.success('Architect deleted successfully');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete architect');
    }
  };

  const handleMarkAsVisited = async (architect: Architect) => {
    try {
      await markAsVisited(architect.id).unwrap();
      toast.success('Architect marked as visited');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to mark as visited');
    }
  };

  const handleRecordVisit = (architect: Architect) => {
    setSelectedArchitect(architect);
    setIsVisitModalOpen(true);
  };

  const handleViewHistory = (architect: Architect) => {
    setSelectedArchitect(architect);
    setIsHistoryModalOpen(true);
  };

  // The type filter is applied server-side too; this keeps the chips honest for any row the
  // server returned before the param landed, and matches the existing client-side search.
  const typedArchitects = typeFilter
    ? architects.filter((a: Architect) => partnerTypeOf(a) === typeFilter)
    : architects;

  const filteredArchitects = searchTerm
    ? typedArchitects.filter((a: Architect) =>
        a.architectureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.firm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.principalArchitectName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : typedArchitects;

  return (
    <div className="min-h-screen bg-background-900 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-900">Architects &amp; Builders</h1>
              <p className="text-xs sm:text-sm text-text-600 mt-1">Manage architecture firms, architects and builders</p>
            </div>
          </div>

          <Button variant="primary" size="sm" onClick={handleAddArchitect} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add {typeFilter ? partnerTypeLabel(typeFilter) : 'Architect'}</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Type filter chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {([
            { value: '', label: 'All' },
            { value: 'ARCHITECT', label: 'Architects' },
            { value: 'BUILDER', label: 'Builders' },
          ] as const).map((chip) => {
            const active = typeFilter === chip.value;
            return (
              <button
                key={chip.value || 'all'}
                onClick={() => {
                  setTypeFilter(chip.value as '' | PartnerType);
                  setPage(0);
                }}
                className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
                style={
                  active
                    ? {
                        borderColor: 'var(--color-primary-600)',
                        background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
                      }
                    : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' }
                }
              >
                <span
                  className={`text-[12.5px] whitespace-nowrap ${
                    active ? 'font-semibold text-text-900' : 'font-medium text-text-700'
                  }`}
                >
                  {chip.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-end">
          {/* Search Bar */}
          <div className="w-full sm:max-w-md sm:flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-text-600" />
              <Input
                placeholder="Search architects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10"
              />
            </div>
          </div>

          {/* Visit Status Filter */}
          <div className="w-full sm:min-w-[150px] sm:w-auto">
            <label className="block text-text-800 text-xs sm:text-sm font-medium mb-2">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
              Visit Status
            </label>
            <select
              value={visitStatusFilter}
              onChange={(e) => {
                setVisitStatusFilter(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background-700 border border-background-600 rounded-lg text-text-900 focus:outline-none focus:ring-2 focus:border-primary-700 focus:ring-primary-700 text-sm sm:text-base"
            >
              <option value="">All</option>
              <option value="VISITED">Visited</option>
              <option value="NOT_VISITED">Not Visited</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="w-full sm:min-w-[150px] sm:w-auto">
            <label className="block text-text-800 text-xs sm:text-sm font-medium mb-2">
              <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background-700 border border-background-600 rounded-lg text-text-900 focus:outline-none focus:ring-2 focus:border-primary-700 focus:ring-primary-700 text-sm sm:text-base"
            >
              <option value="architectureName">Name</option>
              <option value="lastVisitDate">Last Visit Date</option>
            </select>
          </div>

          {/* Sort Direction */}
          <div className="w-full sm:min-w-[120px] sm:w-auto">
            <label className="block text-text-800 text-xs sm:text-sm font-medium mb-2">
              Direction
            </label>
            <select
              value={sortDir}
              onChange={(e) => {
                setSortDir(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background-700 border border-background-600 rounded-lg text-text-900 focus:outline-none focus:ring-2 focus:border-primary-700 focus:ring-primary-700 text-sm sm:text-base"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-text-600">
                  {typeFilter ? `Total ${partnerTypeLabel(typeFilter)}s` : 'Total'}
                </p>
                <div className="text-xl sm:text-2xl font-bold text-text-900 mt-1">
                  {isLoading ? (
                    <div className="h-6 sm:h-8 w-20 sm:w-24 bg-background-700 rounded animate-pulse" />
                  ) : (
                    totalElements
                  )}
                </div>
              </div>
              <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-info flex-shrink-0" />
            </div>
          </Card>
        </div>
      </div>

      {/* Architect List */}
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
        <h2 className="text-lg sm:text-xl font-bold text-text-900 mb-3 sm:mb-4">
          {typeFilter ? `All ${partnerTypeLabel(typeFilter)}s` : 'All Architects & Builders'}
        </h2>
        
        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 sm:h-24 bg-background-700 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredArchitects.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-text-600 mx-auto mb-3 sm:mb-4" />
            <p className="text-text-600 text-base sm:text-lg">No architects found</p>
            {searchTerm && (
              <p className="text-text-600 text-sm mt-2">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredArchitects.map((architect: Architect) => (
              <Card key={architect.id} className="p-3 sm:p-4 bg-background-700 border-background-600">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-text-900 break-words">{architect.architectureName}</h3>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={
                          partnerTypeOf(architect) === 'BUILDER'
                            ? { background: 'var(--st-nego-bg)', color: 'var(--st-nego-fg)', borderColor: 'transparent' }
                            : { background: 'var(--st-design-bg)', color: 'var(--st-design-fg)', borderColor: 'transparent' }
                        }
                      >
                        {partnerTypeLabel(partnerTypeOf(architect))}
                      </span>
                      <ArchitectVisitBadge
                        lastVisitDate={architect.lastVisitDate}
                        hasVisits={architect.hasVisits}
                      />
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm">
                      {architect.firm && (
                        <p className="text-text-600">
                          Firm: <span className="font-medium text-text-700 break-words">{architect.firm}</span>
                        </p>
                      )}
                      {architect.principalArchitectName && (
                        <div className="flex items-center gap-1 text-text-600">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span className="break-words">{architect.principalArchitectName}</span>
                        </div>
                      )}
                      {architect.contactNumber && (
                        <div className="flex items-center gap-1 text-text-600">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{architect.contactNumber}</span>
                        </div>
                      )}
                      {architect.visitCount !== undefined && architect.visitCount > 0 && (
                        <div className="flex items-center gap-1 text-text-600">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>{architect.visitCount} visit{architect.visitCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-shrink-0">
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant="primary" 
                        onClick={() => handleMarkAsVisited(architect)}
                        title="Quick mark as visited"
                        className="bg-success hover:bg-success/90 flex-1 sm:flex-none"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Mark Visited</span>
                        <span className="sm:hidden">Mark</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="primary" 
                        onClick={() => handleRecordVisit(architect)}
                        title="Record detailed visit"
                        className="flex-1 sm:flex-none"
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Record Visit</span>
                        <span className="sm:hidden">Record</span>
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => handleViewHistory(architect)}
                        title="View visit history"
                        className="flex-1 sm:flex-none"
                      >
                        <History className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">History</span>
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleEditArchitect(architect)} className="flex-1 sm:flex-none">
                        <Edit className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteArchitect(architect.id, architect.architectureName)} className="flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      {/* Architect Form Modal */}
      {isModalOpen && (
        <ArchitectFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingArchitect(null);
          }}
          architect={editingArchitect}
          defaultType={typeFilter || 'ARCHITECT'}
        />
      )}

      {/* Visit Form Modal */}
      {isVisitModalOpen && selectedArchitect && (
        <ArchitectVisitFormModal
          isOpen={isVisitModalOpen}
          onClose={() => {
            setIsVisitModalOpen(false);
            setSelectedArchitect(null);
          }}
          architect={selectedArchitect}
        />
      )}

      {/* Visit History Modal */}
      {isHistoryModalOpen && selectedArchitect && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setSelectedArchitect(null);
          }}
          title={`Visit History - ${selectedArchitect.architectureName}`}
          size="lg"
        >
          <div className="max-h-[70vh] overflow-y-auto">
            <ArchitectVisitHistory architect={selectedArchitect} />
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ArchitectsPage;




