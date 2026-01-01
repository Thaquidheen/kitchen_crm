import React, { useState } from 'react';
import { CheckCircle, Circle, Clock, Edit2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useGetPipelineQuery, useUpdatePipelineMutation } from '../customersAPI';
import type { PipelineStage } from '../types';

export interface CustomerPipelineTabProps {
  customerId: number;
}

export const CustomerPipelineTab: React.FC<CustomerPipelineTabProps> = ({ customerId }) => {
  const { data: pipeline, isLoading, error } = useGetPipelineQuery(customerId);
  const [updatePipeline, { isLoading: isUpdating }] = useUpdatePipelineMutation();
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const getStatusIcon = (status: PipelineStage['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'IN_PROGRESS':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'PENDING':
        return <Circle className="w-5 h-5 text-text-500" />;
      default:
        return <Circle className="w-5 h-5 text-text-500" />;
    }
  };

  const getStatusColor = (status: PipelineStage['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-success/20 border-success text-success';
      case 'IN_PROGRESS':
        return 'bg-warning/20 border-warning text-warning';
      case 'PENDING':
        return 'bg-background-500/20 border-background-500 text-text-500';
      default:
        return 'bg-background-500/20 border-background-500 text-text-500';
    }
  };

  const handleStartEditing = (stage: PipelineStage) => {
    setEditingStage(stage.stage);
    setEditNotes(stage.notes || '');
  };

  const handleCancelEditing = () => {
    setEditingStage(null);
    setEditNotes('');
  };

  const handleSaveNotes = async (stage: PipelineStage) => {
    if (!pipeline) return;

    try {
      const updatedStages = pipeline.stages.map((s) =>
        s.stage === stage.stage ? { ...s, notes: editNotes } : s
      );

      await updatePipeline({
        customerId,
        pipeline: { ...pipeline, stages: updatedStages },
      }).unwrap();

      toast.success('Notes updated successfully');
      setEditingStage(null);
      setEditNotes('');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update notes');
    }
  };

  const handleStatusChange = async (stage: PipelineStage, newStatus: PipelineStage['status']) => {
    if (!pipeline) return;

    try {
      const updatedStages = pipeline.stages.map((s) =>
        s.stage === stage.stage ? { ...s, status: newStatus } : s
      );

      await updatePipeline({
        customerId,
        pipeline: { ...pipeline, stages: updatedStages },
      }).unwrap();

      toast.success(`Stage status updated to ${newStatus}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-background-800 border border-background-600 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-background-600 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-background-600 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/20 border border-error rounded-lg p-4">
        <p className="text-error">Failed to load pipeline data</p>
      </div>
    );
  }

  if (!pipeline || !pipeline.stages || pipeline.stages.length === 0) {
    return (
      <div className="bg-background-800 border border-background-600 rounded-lg p-8 text-center">
        <p className="text-text-600">No pipeline stages found for this customer</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Stage Indicator */}
      {pipeline.currentStage && (
        <div className="bg-primary-900/20 border border-primary-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary-500" />
            <div>
              <p className="text-sm text-text-600">Current Stage</p>
              <p className="text-text-900 font-semibold">{pipeline.currentStage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Stages */}
      <div className="space-y-4">
        {pipeline.stages.map((stage, index) => {
          const isEditing = editingStage === stage.stage;
          const isCurrentStage = pipeline.currentStage === stage.stage;

          return (
            <div
              key={stage.stage}
              className={`bg-background-800 border rounded-lg p-4 transition-all ${
                isCurrentStage ? 'border-primary-500 shadow-lg shadow-primary-500/20' : 'border-background-600'
              }`}
            >
              {/* Stage Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  {getStatusIcon(stage.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-text-900">{stage.stage}</h3>
                      {isCurrentStage && (
                        <span className="px-2 py-0.5 bg-primary-500 text-text-900 text-xs rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-600 mt-1">
                      Stage {index + 1} of {pipeline.stages.length}
                    </p>
                  </div>
                </div>

                {/* Status Badge and Dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={stage.status}
                    onChange={(e) =>
                      handleStatusChange(stage, e.target.value as PipelineStage['status'])
                    }
                    className={`px-3 py-1.5 rounded-lg border font-medium text-sm ${getStatusColor(
                      stage.status
                    )} bg-background-800`}
                    disabled={isUpdating}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              {/* Notes Section */}
              <div className="mt-3 pt-3 border-t border-background-600">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-text-600">Notes</p>
                  {!isEditing && (
                    <button
                      onClick={() => handleStartEditing(stage)}
                      className="text-primary-500 hover:text-primary-400 text-sm flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-background-800 border border-background-600 rounded-md text-text-900"
                      rows={3}
                      placeholder="Add notes for this stage..."
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveNotes(stage)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-700 hover:bg-primary-600 text-text-900 text-sm rounded-md"
                        disabled={isUpdating}
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEditing}
                        className="flex items-center gap-1 px-3 py-1.5 border border-background-600 text-text-900 text-sm rounded-md hover:bg-background-700"
                        disabled={isUpdating}
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-text-900 text-sm whitespace-pre-wrap">
                    {stage.notes || 'No notes added yet'}
                  </p>
                )}
              </div>

              {/* Last Updated */}
              {stage.updatedAt && (
                <div className="mt-3 pt-3 border-t border-background-600">
                  <p className="text-xs text-text-500">
                    Last updated: {new Date(stage.updatedAt).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pipeline Metadata */}
      {(pipeline.updatedBy || pipeline.updatedAt) && (
        <div className="bg-background-800 border border-background-600 rounded-lg p-4">
          <p className="text-sm text-text-600">Pipeline Information</p>
          <div className="mt-2 space-y-1">
            {pipeline.updatedBy && (
              <p className="text-sm text-text-900">Last updated by: {pipeline.updatedBy}</p>
            )}
            {pipeline.updatedAt && (
              <p className="text-sm text-text-900">
                Last updated: {new Date(pipeline.updatedAt).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPipelineTab;
