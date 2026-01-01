/**
 * DesignPhaseDetail Component
 * Comprehensive design phase management with all features
 */

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { StaffAssignment } from './StaffAssignment';
import { MeetingScheduler } from './MeetingScheduler';
import { ClientFeedbackForm } from './ClientFeedbackForm';
import { DesignSubmission } from './DesignSubmission';
import { ApprovalWorkflow } from './ApprovalWorkflow';
import { FileUpload } from '@/components/shared/FileUpload';
import { type DesignPhase, DesignStatus, FileCategory } from '@/features/design-phase/types';
import {
  Calendar,
  User,
  MessageSquare,
  Upload,
  CheckCircle,
  Clock,
  ExternalLink,
  DollarSign,
  FileText,
  Users,
  Image,
  Eye,
  Download
} from 'lucide-react';
import {
  useGetDesignFilesByCustomerQuery,
  useDeleteDesignFileMutation,
  useUploadDesignFileMutation
} from '@/features/design-phase/designPhaseFileApi';

interface DesignPhaseDetailProps {
  designPhase: DesignPhase;
  onUpdate: () => void;
  onRefresh: () => void;
}

export function DesignPhaseDetail({ designPhase, onUpdate, onRefresh }: DesignPhaseDetailProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FileText className="h-4 w-4" />, content: <OverviewTab designPhase={designPhase} /> },
    { id: 'designer', label: 'Staff Assignment', icon: <User className="h-4 w-4" />, content: <StaffAssignment designPhase={designPhase} onUpdate={onUpdate} /> },
    { id: 'meetings', label: 'Meetings', icon: <Calendar className="h-4 w-4" />, content: <MeetingScheduler designPhase={designPhase} onUpdate={onUpdate} /> },
    { id: 'submission', label: 'Design Submission', icon: <Upload className="h-4 w-4" />, content: <DesignSubmission designPhase={designPhase} onUpdate={onUpdate} onRefresh={onRefresh} /> },
    { id: 'feedback', label: 'Client Feedback', icon: <MessageSquare className="h-4 w-4" />, content: <ClientFeedbackForm designPhase={designPhase} onUpdate={onUpdate} /> },
    // WhatsApp group feature removed
    { id: 'approval', label: 'Approval Workflow', icon: <CheckCircle className="h-4 w-4" />, content: <ApprovalWorkflow designPhase={designPhase} onUpdate={onUpdate} /> },
    { id: 'files', label: 'Files', icon: <FileText className="h-4 w-4" />, content: <FilesTab designPhase={designPhase} onUpdate={onUpdate} /> },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Status and Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        <Card className="p-4 sm:p-5 lg:p-6 bg-background-800 border-background-600 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-text-900">Status</h3>
            <StatusBadge status={designPhase.designStatus} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-600">Progress</span>
              <span className="text-text-900 font-semibold">{designPhase.designCompletionPercentage}%</span>
            </div>
            <div className="w-full bg-background-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${designPhase.designCompletionPercentage}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 lg:p-6 bg-background-800 border-background-600 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-info/20 rounded-lg">
              <User className="h-5 w-5 text-info" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-text-900">Assigned Staff</h3>
          </div>
          <p className="text-text-900 font-semibold text-base sm:text-lg">
            {designPhase.staffAssignedName || 'Unassigned'}
          </p>
          {designPhase.staffAssignedName && (
            <p className="text-sm text-text-600 mt-1">Assigned staff member</p>
          )}
        </Card>

        <Card className="p-4 sm:p-5 lg:p-6 bg-background-800 border-background-600 hover:shadow-lg transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-warning/20 rounded-lg">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-text-900">Revisions</h3>
          </div>
          <p className="text-text-900 font-semibold text-xl sm:text-2xl lg:text-3xl">
            {designPhase.revisionCount || 0}
          </p>
          <p className="text-sm text-text-600 mt-1">Total revisions</p>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="p-0 bg-background-800 border-background-600">
        <Tabs
          tabs={tabs}
          className="border-b border-background-600"
        />
      </Card>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ designPhase }: { designPhase: DesignPhase }) {
  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 p-4 sm:p-5 lg:p-6">
      {/* Design Requirements */}
      <div>
        <h4 className="text-base sm:text-lg font-semibold text-text-900 mb-3">Design Requirements</h4>
        <div className="bg-background-800 border border-background-600 rounded-lg p-4 sm:p-5">
          <p className="text-text-800 text-sm sm:text-base leading-relaxed">
            {designPhase.designRequirements || 'No requirements specified'}
          </p>
        </div>
      </div>

      {/* Key Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-text-900 mb-3 sm:mb-4">Key Information</h4>
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-background-600">
              <span className="text-sm sm:text-base text-text-600">Customer ID:</span>
              <span className="text-sm sm:text-base text-text-900 font-semibold">#{designPhase.customerId}</span>
            </div>
            {designPhase.quotationNumber && (
              <div className="flex justify-between items-center py-2 border-b border-background-600">
                <span className="text-sm sm:text-base text-text-600">Quotation:</span>
                <span className="text-sm sm:text-base text-text-900 font-semibold">{designPhase.quotationNumber}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-background-600">
              <span className="text-sm sm:text-base text-text-600">Created:</span>
              <span className="text-sm sm:text-base text-text-900 font-semibold">
                {new Date(designPhase.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm sm:text-base text-text-600">Last Updated:</span>
              <span className="text-sm sm:text-base text-text-900 font-semibold">
                {new Date(designPhase.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-base sm:text-lg font-semibold text-text-900 mb-3 sm:mb-4">Communication</h4>
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-background-600">
              <span className="text-sm sm:text-base text-text-600">WhatsApp Group:</span>
              {designPhase.whatsappGroupLink ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(designPhase.whatsappGroupLink, '_blank')}
                  className="flex items-center gap-1 text-primary-600 hover:text-primary-500"
                >
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Open Group</span>
                </Button>
              ) : (
                <span className="text-sm text-text-600">Not created</span>
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-background-600">
              <span className="text-sm sm:text-base text-text-600">Submitted to Client:</span>
              <span className={`text-sm sm:text-base font-semibold ${designPhase.submittedToClient ? 'text-success' : 'text-error'}`}>
                {designPhase.submittedToClient ? 'Yes' : 'No'}
              </span>
            </div>
            {designPhase.submissionDate && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm sm:text-base text-text-600">Submission Date:</span>
                <span className="text-sm sm:text-base text-text-900 font-semibold">
                  {new Date(designPhase.submissionDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Information */}
      {designPhase.designAmountFrozen && (
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-text-900 mb-3">Financial Information</h4>
          <Card className="p-4 sm:p-5 bg-success/10 border-success">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-text-900 font-semibold text-base sm:text-lg">
                  Design Amount Frozen: ₹{designPhase.frozenAmount?.toLocaleString()}
                </p>
                <p className="text-sm text-text-600 mt-1">Amount has been frozen for this design</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Client Feedback */}
      {designPhase.clientFeedback && (
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-text-900 mb-3">Client Feedback</h4>
          <div className="bg-info/10 border border-info rounded-lg p-4 sm:p-5">
            <p className="text-text-800 mb-2 text-sm sm:text-base leading-relaxed">{designPhase.clientFeedback}</p>
            {designPhase.feedbackDate && (
              <p className="text-sm text-text-600">
                Received: {new Date(designPhase.feedbackDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Meeting Information */}
      {designPhase.meetingScheduled && (
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-text-900 mb-3">Meeting Information</h4>
          <div className="bg-warning/10 border border-warning rounded-lg p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-warning/20 rounded-lg">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <span className="text-text-900 font-semibold text-sm sm:text-base">
                {new Date(designPhase.meetingScheduled).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-warning/20">
              <span className="text-sm sm:text-base text-text-600">Status:</span>
              <span className={`text-sm sm:text-base font-semibold ${designPhase.meetingCompleted ? 'text-success' : 'text-warning'}`}>
                {designPhase.meetingCompleted ? 'Completed' : 'Scheduled'}
              </span>
            </div>
            {designPhase.meetingNotes && (
              <div className="mt-3 pt-3 border-t border-warning/20">
                <p className="text-sm text-text-600 mb-1">Notes:</p>
                <p className="text-text-800 text-sm sm:text-base">{designPhase.meetingNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Files Tab Component
function FilesTab({ designPhase, onUpdate }: { designPhase: DesignPhase; onUpdate: () => void }) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const { data: filesResponse, isLoading: loadingFiles, refetch } = useGetDesignFilesByCustomerQuery(designPhase.customerId);
  const [deleteFile] = useDeleteDesignFileMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadDesignFileMutation();

  const serverFiles = filesResponse?.data || [];

  const handleFileUpload = async (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);

    // Upload files to server
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('customerId', designPhase.customerId.toString());
        formData.append('fileCategory', 'DESIGN');
        formData.append('description', `Uploaded from Files tab: ${file.name}`);

        await uploadFile({ formData }).unwrap();
        toast.success(`${file.name} uploaded successfully`);
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}`);
        console.error('Upload error:', error);
      }
    }

    setUploadedFiles([]);
    refetch();
    onUpdate();
  };

  const handleDeleteServerFile = async (fileId: number, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      try {
        await deleteFile(fileId).unwrap();
        toast.success('File deleted successfully');
        refetch();
        onUpdate();
      } catch (error) {
        toast.error('Failed to delete file');
        console.error('Delete error:', error);
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 p-4 sm:p-5 lg:p-6">
      {/* File Upload */}
      <div>
        <h4 className="text-base sm:text-lg font-semibold text-text-900 mb-3 sm:mb-4">Upload Design Files</h4>
        <FileUpload
          accept={{
            'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
            'application/pdf': ['.pdf'],
            'application/zip': ['.zip'],
            'application/x-zip-compressed': ['.zip']
          }}
          maxSize={50 * 1024 * 1024} // 50MB
          onFilesSelected={handleFileUpload}
          multiple={true}
          maxFiles={10}
        />
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-text-900 mb-3 sm:mb-4">Uploaded Files</h4>
          <div className="space-y-2 sm:space-y-3">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-background-800 border border-background-600 rounded-lg hover:border-background-500 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-background-700 rounded-lg">
                    {getFileIcon(file)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-900 font-semibold text-sm sm:text-base truncate">{file.name}</p>
                    <p className="text-xs sm:text-sm text-text-600">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(URL.createObjectURL(file), '_blank')}
                    className="text-text-600 hover:text-info"
                    title="View file"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-text-600 hover:text-error"
                    title="Remove file"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Server Files */}
      {loadingFiles ? (
        <div className="text-center py-8 sm:py-12">
          <div className="animate-pulse text-text-600">Loading files...</div>
        </div>
      ) : serverFiles.length > 0 ? (
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-text-900 mb-3 sm:mb-4">Uploaded Files ({serverFiles.length})</h4>
          <div className="space-y-2 sm:space-y-3">
            {serverFiles.map((file: any) => (
              <div key={file.id} className="flex items-center justify-between p-3 sm:p-4 bg-background-800 border border-background-600 rounded-lg hover:border-background-500 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-background-700 rounded-lg">
                    {file.fileType?.startsWith('image/') ? <Image className="h-4 w-4 text-info" /> : <FileText className="h-4 w-4 text-text-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-900 font-semibold text-sm sm:text-base truncate">{file.originalFileName}</p>
                    <p className="text-xs sm:text-sm text-text-600">
                      {formatFileSize(file.fileSize)} • {file.fileCategory} • Uploaded by {file.uploadedBy}
                    </p>
                    <p className="text-xs text-text-500 mt-1">{new Date(file.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.fileUrl, '_blank')}
                    title="View file"
                    className="text-text-600 hover:text-info"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = file.fileUrl;
                      link.download = file.originalFileName;
                      link.click();
                    }}
                    title="Download file"
                    className="text-text-600 hover:text-success"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteServerFile(file.id, file.originalFileName)}
                    title="Delete file"
                    className="text-text-600 hover:text-error"
                  >
                    <Download className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-text-900 mb-3 sm:mb-4">Uploaded Files</h4>
          <div className="text-center py-8 sm:py-12 bg-background-800 border border-background-600 rounded-lg">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-text-600 mx-auto mb-4" />
            <p className="text-text-600 text-sm sm:text-base">No files uploaded yet</p>
            <p className="text-xs sm:text-sm text-text-500 mt-1">Upload files using the form above</p>
          </div>
        </div>
      )}

      {/* File Categories */}
      <div>
        <h4 className="text-base sm:text-lg font-semibold text-text-900 mb-3 sm:mb-4">File Categories</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5 bg-background-800 border-background-600 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-info/20 rounded-lg">
                <Image className="h-5 w-5 text-info" />
              </div>
              <h5 className="font-semibold text-text-900 text-sm sm:text-base">Design Images</h5>
            </div>
            <p className="text-xs sm:text-sm text-text-600">3D renders, sketches, and visualizations</p>
          </Card>
          
          <Card className="p-4 sm:p-5 bg-background-800 border-background-600 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-success/20 rounded-lg">
                <FileText className="h-5 w-5 text-success" />
              </div>
              <h5 className="font-semibold text-text-900 text-sm sm:text-base">Technical Drawings</h5>
            </div>
            <p className="text-xs sm:text-sm text-text-600">CAD files, blueprints, and specifications</p>
          </Card>
          
          <Card className="p-4 sm:p-5 bg-background-800 border-background-600 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <Upload className="h-5 w-5 text-primary-500" />
              </div>
              <h5 className="font-semibold text-text-900 text-sm sm:text-base">Reference Materials</h5>
            </div>
            <p className="text-xs sm:text-sm text-text-600">Client references and inspiration images</p>
          </Card>
          
          <Card className="p-4 sm:p-5 bg-background-800 border-background-600 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-warning/20 rounded-lg">
                <Download className="h-5 w-5 text-warning" />
              </div>
              <h5 className="font-semibold text-text-900 text-sm sm:text-base">Documents</h5>
            </div>
            <p className="text-xs sm:text-sm text-text-600">Contracts, proposals, and reports</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DesignPhaseDetail;
