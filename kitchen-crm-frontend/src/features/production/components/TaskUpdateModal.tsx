import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { CheckSquare, Square } from 'lucide-react';
import type { ProductionInstallation } from '../types';

// Production task definitions grouped by phase
const PRODUCTION_TASKS = {
  production: [
    { key: 'epd_received', label: 'EPD Received', field: 'epdReceived' },
    { key: 'production_started', label: 'Production Started', field: 'productionStarted' },
  ],
  sitePreparation: [
    { key: 'site_visit_marking', label: 'Site Visit & Marking', field: 'siteVisitMarking' },
    { key: 'flooring_completed', label: 'Flooring Completed', field: 'flooringCompleted' },
    { key: 'ceiling_completed', label: 'Ceiling Completed', field: 'ceilingCompleted' },
  ],
  delivery: [
    { key: 'carcass_at_site', label: 'Carcass Delivered', field: 'carcassAtSite' },
    { key: 'countertop_at_site', label: 'Countertop Delivered', field: 'countertopAtSite' },
    { key: 'shutters_at_site', label: 'Shutters Delivered', field: 'shuttersAtSite' },
  ],
  installation: [
    { key: 'carcass_installed', label: 'Carcass Installed', field: 'carcassInstalled' },
    { key: 'countertop_installed', label: 'Countertop Installed', field: 'countertopInstalled' },
    { key: 'shutters_installed', label: 'Shutters Installed', field: 'shuttersInstalled' },
    { key: 'appliances_installed', label: 'Appliances Installed', field: 'appliancesInstalled' },
    { key: 'lights_installed', label: 'Lights Installed', field: 'lightsInstalled' },
  ],
  completion: [
    { key: 'final_cleaning_done', label: 'Final Cleaning Done', field: 'finalCleaningDone' },
  ],
};

// Flatten all tasks for dropdown
const ALL_TASKS = Object.entries(PRODUCTION_TASKS).flatMap(([phase, tasks]) =>
  tasks.map((task) => ({ ...task, phase }))
);

export interface TaskUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { taskName: string; completed: boolean; completionDate?: string }) => Promise<void>;
  production: ProductionInstallation;
  title?: string;
}

export const TaskUpdateModal: React.FC<TaskUpdateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  production,
  title = 'Update Task Status',
}) => {
  const [selectedTask, setSelectedTask] = useState('');
  const [completed, setCompleted] = useState(false);
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current status of selected task
  const getTaskStatus = (fieldName: string): boolean => {
    return (production as any)[fieldName] === true;
  };

  // Update completed status when task changes
  const handleTaskChange = (taskKey: string) => {
    setSelectedTask(taskKey);
    const task = ALL_TASKS.find((t) => t.key === taskKey);
    if (task) {
      setCompleted(getTaskStatus(task.field));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) {
      toast.error('Please select a task');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        taskName: selectedTask,
        completed,
        completionDate: completed ? completionDate : undefined,
      });
      toast.success('Task updated successfully!');
      handleClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTask('');
    setCompleted(false);
    setCompletionDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  const selectedTaskInfo = ALL_TASKS.find((t) => t.key === selectedTask);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Task Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Task
          </label>
          <Select
            value={selectedTask}
            onChange={(e) => handleTaskChange(e.target.value)}
          >
            <option value="">-- Select a task --</option>
            <optgroup label="Production Phase">
              {PRODUCTION_TASKS.production.map((task) => (
                <option key={task.key} value={task.key}>
                  {task.label} {getTaskStatus(task.field) ? '(Completed)' : '(Pending)'}
                </option>
              ))}
            </optgroup>
            <optgroup label="Site Preparation">
              {PRODUCTION_TASKS.sitePreparation.map((task) => (
                <option key={task.key} value={task.key}>
                  {task.label} {getTaskStatus(task.field) ? '(Completed)' : '(Pending)'}
                </option>
              ))}
            </optgroup>
            <optgroup label="Delivery">
              {PRODUCTION_TASKS.delivery.map((task) => (
                <option key={task.key} value={task.key}>
                  {task.label} {getTaskStatus(task.field) ? '(Completed)' : '(Pending)'}
                </option>
              ))}
            </optgroup>
            <optgroup label="Installation">
              {PRODUCTION_TASKS.installation.map((task) => (
                <option key={task.key} value={task.key}>
                  {task.label} {getTaskStatus(task.field) ? '(Completed)' : '(Pending)'}
                </option>
              ))}
            </optgroup>
            <optgroup label="Completion">
              {PRODUCTION_TASKS.completion.map((task) => (
                <option key={task.key} value={task.key}>
                  {task.label} {getTaskStatus(task.field) ? '(Completed)' : '(Pending)'}
                </option>
              ))}
            </optgroup>
          </Select>
        </div>

        {/* Task Status */}
        {selectedTask && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Task Status
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCompleted(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    !completed
                      ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400'
                      : 'border-gray-600 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <Square className="w-4 h-4" />
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setCompleted(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    completed
                      ? 'bg-green-600/20 border-green-500 text-green-400'
                      : 'border-gray-600 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  Completed
                </button>
              </div>
            </div>

            {/* Completion Date (only if completed) */}
            {completed && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Completion Date
                </label>
                <Input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                />
              </div>
            )}

            {/* Current Status Info */}
            {selectedTaskInfo && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">
                  Current Status:{' '}
                  <span className={getTaskStatus(selectedTaskInfo.field) ? 'text-green-400' : 'text-yellow-400'}>
                    {getTaskStatus(selectedTaskInfo.field) ? 'Completed' : 'Pending'}
                  </span>
                </p>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!selectedTask || isSubmitting}
            className="bg-red-700 hover:bg-red-600 text-white"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Updating...' : 'Update Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskUpdateModal;
