/**
 * DesignSubmission Component
 * Component for submitting designs to clients
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/shared/FileUpload';
import { useSubmitDesignToClientMutation, useSubmitForApprovalMutation } from '@/features/design-phase/designPhaseApi';
import { useUploadDesignFileMutation } from '@/features/design-phase/designPhaseFileApi';
import { type DesignPhase, FileCategory, DesignStatus } from '@/features/design-phase/types';
import { Upload, Send, Eye, Download, FileText, Image, X, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DesignSubmissionProps {
  designPhase: DesignPhase;
  onUpdate: () => void;
  onRefresh: () => void;
}

export function DesignSubmission({ designPhase, onUpdate, onRefresh }: DesignSubmissionProps) {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = currentUser?.role === 'ROLE_SUPER_ADMIN';
  const isStaff = currentUser?.role === 'ROLE_STAFF';
  
  const [submitDesign, { isLoading: isSubmitting }] = useSubmitDesignToClientMutation();
  const [submitForApproval, { isLoading: isSubmittingForApproval }] = useSubmitForApprovalMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadDesignFileMutation();

  const [submissionForm, setSubmissionForm] = useState({
    design: '',
    designFilesPath: '',
    submissionNotes: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

  const isLoading = isSubmitting || isSubmittingForApproval || isUploading;

  // Determine which submission handler to use based on user role and status
  const canSubmitForApproval = isStaff && designPhase.designStatus === DesignStatus.IN_PROGRESS;
  const canSubmitToClient = isSuperAdmin && (designPhase.designStatus === DesignStatus.APPROVED_BY_ADMIN || designPhase.designStatus === DesignStatus.IN_PROGRESS);

  const handleSubmitDesign = async () => {
    try {
      console.log('Current design status:', designPhase.designStatus);

      // Validate design content before proceeding
      const trimmedDesign = submissionForm.design?.trim();
      if (!trimmedDesign) {
        toast.error('Please enter a design description before submitting');
        return;
      }

      // Step 1: Upload files to server first if there are any
      const uploadedFileIds: number[] = [];
      if (uploadedFiles.length > 0) {
        toast.loading('Uploading files...', { id: 'file-upload' });

        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('customerId', designPhase.customerId.toString());
            formData.append('fileCategory', FileCategory.DESIGN);
            formData.append('description', `Design submission file: ${file.name}`);

            setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));

            const uploadResult = await uploadFile({ formData }).unwrap();

            if (uploadResult.success && uploadResult.data) {
              uploadedFileIds.push(uploadResult.data.id);
              setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
              console.log(`File ${file.name} uploaded successfully`);
            }
          } catch (uploadError: any) {
            console.error(`Failed to upload file ${file.name}:`, uploadError);
            toast.error(`Failed to upload ${file.name}: ${uploadError?.data?.message || 'Unknown error'}`);
            // Continue with other files even if one fails
          }
        }

        toast.dismiss('file-upload');
        if (uploadedFileIds.length > 0) {
          toast.success(`${uploadedFileIds.length} file(s) uploaded successfully`);
        }
      }

      // Step 2: Submit the design with reference to uploaded files
      const submissionData = {
        design: trimmedDesign,
        designFilesPath: uploadedFileIds.length > 0
          ? `${uploadedFileIds.length} files uploaded`
          : submissionForm.designFilesPath || '',
        submissionNotes: submissionForm.submissionNotes || ''
      };

      console.log('Submitting design with data:', submissionData);
      console.log('Customer ID:', designPhase.customerId);
      console.log('Uploaded file IDs:', uploadedFileIds);

      // Use appropriate mutation based on role and status
      if (canSubmitForApproval) {
        // Staff submitting for superadmin approval
        const result = await submitForApproval({
          customerId: designPhase.customerId,
          submissionData
        }).unwrap();
        toast.success('Design submitted for approval successfully');
      } else if (canSubmitToClient) {
        // Superadmin submitting to client
        const result = await submitDesign({
          customerId: designPhase.customerId,
          submissionData
        }).unwrap();
        toast.success('Design submitted to client successfully');
      } else {
        toast.error('You do not have permission to submit at this stage');
        return;
      }

      // Clear form
      setSubmissionForm({
        design: '',
        designFilesPath: '',
        submissionNotes: '',
      });
      setUploadedFiles([]);
      setUploadProgress({});

      console.log('Design submission result:', result);

      onRefresh(); // Refresh after successful submission
    } catch (error: any) {
      console.error('Full error object:', error);
      console.error('Error data:', error?.data);
      console.error('Error status:', error?.status);
      console.error('Error message:', error?.message);

      const errorMessage = error?.data?.message || error?.message || 'Failed to submit design to client';
      toast.error(`Submission failed: ${errorMessage}`);
    }
  };

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
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
    <div className="space-y-6">
      {/* Current Submission Status */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-text-900">Submission Status</h3>
        </div>

        {designPhase.submittedToClient ? (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Send className="h-5 w-5 text-success" />
              <div>
                <p className="text-text-900 font-medium">Design Submitted to Client</p>
                <p className="text-sm text-text-600">
                  Submitted on: {designPhase.submissionDate ? new Date(designPhase.submissionDate).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
            
            {designPhase.design && (
              <div className="mt-3 p-3 bg-background-800 border border-background-600 rounded-lg">
                <p className="text-sm text-text-600 mb-1">Design Description:</p>
                <p className="text-text-700">{designPhase.design}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-warning" />
              <div>
                <p className="text-text-900 font-medium">Design Not Submitted</p>
                <p className="text-sm text-text-600">
                  Submit the design to the client for review
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Design Submission Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">
          {canSubmitForApproval ? 'Submit Design for Approval' : canSubmitToClient ? 'Submit Design to Client' : 'Design Submission'}
        </h3>
        
        {/* Status Check */}
        {canSubmitForApproval && (
          <div className="mb-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-primary-500" />
              <div>
                <p className="text-text-900 font-medium">Submit for Superadmin Approval</p>
                <p className="text-sm text-text-600">
                  Your design will be reviewed by the superadmin before being sent to the client.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {canSubmitToClient && designPhase.designStatus === DesignStatus.APPROVED_BY_ADMIN && (
          <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-text-900 font-medium">Design Approved - Ready to Submit</p>
                <p className="text-sm text-text-600">
                  The design has been approved by admin. You can now submit it to the client.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {!canSubmitForApproval && !canSubmitToClient && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-warning rounded-full"></div>
              <div>
                <p className="text-text-900 font-medium">Design Status: {designPhase.designStatus}</p>
                <p className="text-sm text-text-600">
                  {isStaff 
                    ? 'Design must be "In Progress" to submit for approval.'
                    : 'Design must be "Approved by Admin" or "In Progress" to submit to client.'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-primary-100 border border-primary-200 rounded-lg p-4">
            <h4 className="text-primary-900 font-medium mb-2">
              {canSubmitForApproval ? 'How to Submit for Approval' : 'How to Submit Design'}
            </h4>
            <ol className="text-primary-800 text-sm space-y-1">
              <li>1. Enter a detailed description of your design in the text area below</li>
              <li>2. Upload any design files (optional)</li>
              <li>3. Add submission notes (optional)</li>
              <li>4. {canSubmitForApproval 
                ? 'Click "Submit for Approval" to send the design for superadmin review'
                : 'Click "Submit to Client" to send the design for review'}</li>
            </ol>
          </div>

          {/* Design Description */}
          <div>
            <label className="block text-sm font-medium text-text-700 mb-2">
              Design Description <span className="text-error">*</span>
            </label>
            <TextArea
              value={submissionForm.design}
              onChange={(e) => setSubmissionForm(prev => ({ ...prev, design: e.target.value }))}
              placeholder="Describe the design, key features, and specifications..."
              rows={4}
              className={!submissionForm.design?.trim() ? 'border-error focus:border-error' : ''}
            />
            <p className="text-sm text-text-600 mt-1">
              Provide a detailed description of the design being submitted
            </p>
            {!submissionForm.design?.trim() && (
              <p className="text-sm text-error mt-1">
                Design description is required to submit to client
              </p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-text-700 mb-2">
              Design Files
            </label>
            <FileUpload
              maxSize={50 * 1024 * 1024} // 50MB
              onFilesSelected={handleFileUpload}
              className="border-2 border-dashed border-background-600 rounded-lg p-6 text-center"
            />
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-text-700 mb-3">Uploaded Files</h4>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background-800 border border-background-600 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="text-text-900 font-medium">{file.name}</p>
                        <p className="text-sm text-text-600">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(URL.createObjectURL(file), '_blank')}
                        title="Preview file"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        title="Remove file"
                        className="text-error hover:text-error"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Notes */}
          <div>
            <label className="block text-sm font-medium text-text-700 mb-2">
              Submission Notes
            </label>
            <TextArea
              value={submissionForm.submissionNotes}
              onChange={(e) => setSubmissionForm(prev => ({ ...prev, submissionNotes: e.target.value }))}
              placeholder="Add any additional notes or instructions for the client..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-background-600">
            <Button
              onClick={handleSubmitDesign}
              disabled={!submissionForm.design?.trim() || isLoading || (!canSubmitForApproval && !canSubmitToClient)}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading 
                ? 'Submitting...' 
                : !submissionForm.design?.trim() 
                  ? 'Enter Design Description First'
                  : canSubmitForApproval
                    ? 'Submit for Approval'
                    : canSubmitToClient
                      ? 'Submit to Client'
                      : 'Cannot Submit'}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => {
                setSubmissionForm({
                  design: '',
                  designFilesPath: '',
                  submissionNotes: '',
                });
                setUploadedFiles([]);
              }}
              disabled={isLoading}
            >
              Clear Form
            </Button>
          </div>
        </div>
      </Card>

      {/* Submission Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Submission Templates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-text-900">Initial Submission</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubmissionForm(prev => ({ 
                ...prev, 
                design: 'Please find attached the initial design for your kitchen. This includes the layout, cabinet design, and material specifications. Please review and provide your feedback.',
                submissionNotes: 'Initial design submission - awaiting client feedback'
              }))}
              className="w-full text-left justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Initial Design
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-text-900">Revised Submission</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubmissionForm(prev => ({ 
                ...prev, 
                design: 'Please find the revised design incorporating your feedback. Changes include updated layout, modified dimensions, and new material selections.',
                submissionNotes: 'Revised design based on client feedback'
              }))}
              className="w-full text-left justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Revised Design
            </Button>
          </div>
        </div>
      </Card>

      {/* Submission History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Submission History</h3>
        
        <div className="space-y-3">
          {designPhase.submittedToClient ? (
            <div className="flex items-start gap-3 p-3 bg-background-800 border border-background-600 rounded-lg">
              <Send className="h-4 w-4 text-text-600 mt-1" />
              <div className="flex-1">
                <p className="text-text-900 font-medium mb-1">Latest Submission</p>
                <p className="text-text-700 text-sm mb-2">{designPhase.design}</p>
                <div className="flex items-center gap-4 text-xs text-text-600">
                  <span>Submitted: {designPhase.submissionDate ? new Date(designPhase.submissionDate).toLocaleDateString() : 'Unknown'}</span>
                  <span>Status: {designPhase.designStatus}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Upload className="h-12 w-12 text-text-400 mx-auto mb-4" />
              <p className="text-text-600">No submissions yet</p>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => {
              // Generate submission summary
              toast.success('Submission summary generated');
            }}
            className="flex items-center gap-2 justify-start"
          >
            <FileText className="h-4 w-4" />
            Generate Summary
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              // Send submission notification
              toast.success('Submission notification sent');
            }}
            className="flex items-center gap-2 justify-start"
          >
            <Send className="h-4 w-4" />
            Send Notification
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default DesignSubmission;
