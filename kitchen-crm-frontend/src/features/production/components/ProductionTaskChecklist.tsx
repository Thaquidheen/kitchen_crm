import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  CheckCircle,
  Circle,
  Loader2,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Edit2,
  X
} from 'lucide-react';
import type { ProductionInstallation, ProductionCustomTask, ProductionTaskGroup, TaskPriority } from '../types';
import {
  useGetTaskGroupsByCustomerQuery,
  useApplyStandardStagesMutation,
  useSetTaskReminderMutation,
  useCreateTaskGroupMutation,
  useUpdateTaskGroupMutation,
  useDeleteTaskGroupMutation,
  useCreateCustomTaskMutation,
  useToggleCustomTaskMutation,
  useDeleteCustomTaskMutation,
} from '../productionAPI';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BellRing, ListChecks } from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-400',
  MEDIUM: 'text-blue-400',
  HIGH: 'text-orange-400',
  URGENT: 'text-red-400',
};

const PRIORITY_BG: Record<string, string> = {
  LOW: 'bg-gray-500/10',
  MEDIUM: 'bg-blue-500/10',
  HIGH: 'bg-orange-500/10',
  URGENT: 'bg-red-500/10',
};

interface ProductionTaskChecklistProps {
  production: ProductionInstallation;
  customerId: number;
  onTaskUpdate: (data: { taskName: string; completed: boolean; completionDate?: string }) => Promise<void>;
}

export const ProductionTaskChecklist: React.FC<ProductionTaskChecklistProps> = ({
  production,
  customerId,
}) => {
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  /** Stage id currently having a sub-stage added, or null. */
  const [addingSubStageFor, setAddingSubStageFor] = useState<number | null>(null);
  const [newSubStageTitle, setNewSubStageTitle] = useState('');
  const [showAddTaskFormForGroup, setShowAddTaskFormForGroup] = useState<number | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupTitle, setEditingGroupTitle] = useState('');
  const [newGroup, setNewGroup] = useState({ groupTitle: '', groupDescription: '' });
  const [newTask, setNewTask] = useState({
    taskTitle: '',
    taskDescription: '',
    priority: 'MEDIUM' as TaskPriority,
  });

  // Task Groups API hooks
  const { data: taskGroupsResponse, isLoading: isLoadingGroups } = useGetTaskGroupsByCustomerQuery(customerId);
  const [createTaskGroup, { isLoading: isCreatingGroup }] = useCreateTaskGroupMutation();
  const [updateTaskGroup] = useUpdateTaskGroupMutation();
  const [deleteTaskGroup] = useDeleteTaskGroupMutation();
  const [createCustomTask, { isLoading: isCreatingTask }] = useCreateCustomTaskMutation();
  const [toggleCustomTask] = useToggleCustomTaskMutation();
  const [deleteCustomTask] = useDeleteCustomTaskMutation();
  const [applyStandardStages, { isLoading: isApplying }] = useApplyStandardStagesMutation();
  const [setTaskReminder, { isLoading: isSettingReminder }] = useSetTaskReminderMutation();

  // Set-reminder dialog: date-driven checklist items ("30th day", "5 days before delivery")
  // create an ordinary customer-owned reminder, pre-filled from the task, so it lands in the
  // notification bell and the global Reminders page like any other.
  const [reminderTask, setReminderTask] = useState<ProductionCustomTask | null>(null);
  const [remDate, setRemDate] = useState('');
  const [remNotes, setRemNotes] = useState('');

  const openReminderFor = (task: ProductionCustomTask) => {
    setReminderTask(task);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRemDate(tomorrow.toISOString().split('T')[0]);
    setRemNotes('');
  };

  const handleSetReminder = async () => {
    if (!reminderTask || !remDate) return;
    try {
      await setTaskReminder({
        taskId: reminderTask.id,
        customerId,
        remindAt: `${remDate}T10:00:00`,
        notes: remNotes.trim() || undefined,
      }).unwrap();
      toast.success('Reminder set — it will appear in the bell on that day');
      setReminderTask(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to set reminder');
    }
  };

  const handleApplyStandard = async () => {
    try {
      const res = await applyStandardStages(customerId).unwrap();
      toast.success(res?.message || 'Standard checklist applied');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to apply the standard checklist');
    }
  };

  const taskGroups = taskGroupsResponse?.success ? taskGroupsResponse.data || [] : [];

  // Initially expand only the current stage (first with open tasks); everything else stays
  // collapsed so a 36-task checklist opens at a readable height.
  React.useEffect(() => {
    if (taskGroups.length > 0 && expandedGroups.size === 0) {
      const current =
        taskGroups.find((g) => (g.completedTasks ?? 0) < (g.totalTasks ?? 0)) ?? taskGroups[0];
      setExpandedGroups(new Set([current.id]));
    }
  }, [taskGroups]);

  const toggleGroupExpanded = (groupId: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleCreateGroup = async () => {
    if (!newGroup.groupTitle.trim()) {
      toast.error('Group title is required');
      return;
    }

    try {
      await createTaskGroup({
        customerId,
        groupTitle: newGroup.groupTitle,
        groupDescription: newGroup.groupDescription,
      }).unwrap();

      toast.success('Group created successfully');
      setNewGroup({ groupTitle: '', groupDescription: '' });
      setShowAddGroupForm(false);
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  /** Same endpoint as a stage — a sub-stage is just a group with a parent. */
  const handleCreateSubStage = async (parentGroupId: number) => {
    if (!newSubStageTitle.trim()) {
      toast.error('Sub-stage title is required');
      return;
    }
    try {
      await createTaskGroup({
        customerId,
        groupTitle: newSubStageTitle.trim(),
        parentGroupId,
      }).unwrap();
      toast.success('Sub-stage added');
      setNewSubStageTitle('');
      setAddingSubStageFor(null);
    } catch (error) {
      console.error('Error creating sub-stage:', error);
      toast.error('Failed to add sub-stage');
    }
  };

  const handleUpdateGroupTitle = async (groupId: number) => {
    if (!editingGroupTitle.trim()) {
      toast.error('Group title is required');
      return;
    }

    try {
      await updateTaskGroup({
        groupId,
        data: { groupTitle: editingGroupTitle },
        customerId,
      }).unwrap();

      toast.success('Group updated successfully');
      setEditingGroupId(null);
      setEditingGroupTitle('');
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group');
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Are you sure you want to delete this group and all its tasks?')) return;

    try {
      await deleteTaskGroup({ groupId, customerId }).unwrap();
      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const handleCreateTask = async (groupId: number) => {
    if (!newTask.taskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      await createCustomTask({
        customerId,
        taskTitle: newTask.taskTitle,
        taskDescription: newTask.taskDescription,
        phase: 'CUSTOM',
        priority: newTask.priority,
        taskGroupId: groupId,
      }).unwrap();

      toast.success('Task created successfully');
      setNewTask({ taskTitle: '', taskDescription: '', priority: 'MEDIUM' });
      setShowAddTaskFormForGroup(null);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleToggleTask = async (task: ProductionCustomTask) => {
    const taskKey = `task-${task.id}`;
    setLoadingTasks(prev => new Set(prev).add(taskKey));

    try {
      await toggleCustomTask({ taskId: task.id, customerId }).unwrap();
      toast.success(task.completed ? 'Task marked as pending' : 'Task marked as completed');
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Failed to update task');
    } finally {
      setLoadingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskKey);
        return next;
      });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteCustomTask({ taskId, customerId }).unwrap();
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  // Calculate overall progress
  const totalTasks = taskGroups.reduce((sum, g) => sum + g.totalTasks, 0);
  const completedTasks = taskGroups.reduce((sum, g) => sum + g.completedTasks, 0);
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const renderTask = (task: ProductionCustomTask) => {
    const taskKey = `task-${task.id}`;
    const isLoading = loadingTasks.has(taskKey);

    return (
      <div
        key={taskKey}
        className={`flex items-center justify-between p-3 pl-10 bg-background-900 hover:bg-background-800 transition-colors border-t border-background-700 ${
          isLoading ? 'opacity-50' : ''
        }`}
      >
        <div
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={() => !isLoading && handleToggleTask(task)}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-primary-500 animate-spin shrink-0" />
          ) : (
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors"
              style={
                task.completed
                  ? { background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }
                  : { border: '1.5px solid var(--color-background-500)', color: 'transparent' }
              }
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </span>
          )}
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${task.completed ? 'text-text-600 line-through' : 'text-text-900'}`}>
                {task.taskTitle}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_BG[task.priority]} ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </span>
            </div>
            {task.taskDescription && (
              <span className="text-xs text-text-500 mt-0.5">{task.taskDescription}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {task.completionDate && (
            <span className="text-xs text-text-500 whitespace-nowrap">
              {new Date(task.completionDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
              {(task as any).completedByUserName && <> · by {(task as any).completedByUserName}</>}
            </span>
          )}
          {!task.completed && (task as any).reminderDate ? (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap tabular-nums"
              style={{ background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }}
              title="A reminder is set for this task"
            >
              <BellRing className="w-3 h-3" />
              {new Date((task as any).reminderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          ) : !task.completed ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openReminderFor(task);
              }}
              className="p-1 text-text-500 hover:text-primary-500 transition-colors"
              title="Set a reminder for this task"
            >
              <BellRing className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTask(task.id);
            }}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderAddTaskForm = (groupId: number) => (
    <div className="p-3 pl-10 bg-background-800 space-y-2 border-t border-background-700">
      <input
        type="text"
        placeholder="Task title *"
        value={newTask.taskTitle}
        onChange={(e) => setNewTask({ ...newTask, taskTitle: e.target.value })}
        className="w-full px-3 py-2 bg-background-900 border border-background-600 rounded-lg text-sm text-text-900 placeholder-text-500 focus:outline-none focus:border-primary-500"
        autoFocus
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={newTask.taskDescription}
        onChange={(e) => setNewTask({ ...newTask, taskDescription: e.target.value })}
        className="w-full px-3 py-2 bg-background-900 border border-background-600 rounded-lg text-sm text-text-900 placeholder-text-500 focus:outline-none focus:border-primary-500"
      />
      <div className="flex items-center gap-2">
        <select
          value={newTask.priority}
          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
          className="flex-1 px-3 py-2 bg-background-900 border border-background-600 rounded-lg text-sm text-text-900 focus:outline-none focus:border-primary-500"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <button
          onClick={() => {
            setShowAddTaskFormForGroup(null);
            setNewTask({ taskTitle: '', taskDescription: '', priority: 'MEDIUM' });
          }}
          className="p-2 text-text-600 hover:text-text-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleCreateTask(groupId)}
          disabled={isCreatingTask || !newTask.taskTitle.trim()}
          className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {isCreatingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
      </div>
    </div>
  );

  const STAGE_ST = ['s1', 's2', 's3'];
  const STAGE_COLORS: Record<string, { bg: string; fg: string }> = {
    s1: { bg: 'var(--st-lead-bg)', fg: 'var(--st-lead-fg)' },
    s2: { bg: 'var(--st-design-bg)', fg: 'var(--st-design-fg)' },
    s3: { bg: 'var(--st-quote-bg)', fg: 'var(--st-quote-fg)' },
  };

  /**
   * Renders a stage, and recurses one level for its sub-stages.
   *
   * Depth is a parameter rather than a separate component because a sub-stage is the same thing as
   * a stage — same header, same tasks, same add/edit/delete — just indented, with a lighter frame
   * and its ordinal shown as "2.1" instead of "2". The backend caps nesting at two levels, so this
   * recursion cannot run away.
   */
  const renderGroup = (group: ProductionTaskGroup, idx: number, depth = 0, parentIdx?: number) => {
    const isExpanded = expandedGroups.has(group.id);
    const isEditing = editingGroupId === group.id;
    const groupProgress = group.totalTasks > 0 ? Math.round((group.completedTasks / group.totalTasks) * 100) : 0;
    const allDone = group.totalTasks > 0 && group.completedTasks === group.totalTasks;
    const stageColor = STAGE_COLORS[STAGE_ST[(parentIdx ?? idx) % 3]];
    const ordinal = depth === 0 ? String(idx + 1) : `${(parentIdx ?? 0) + 1}.${idx + 1}`;
    const subGroups = group.subGroups ?? [];

    return (
      <div
        key={group.id}
        className={
          depth === 0
            ? 'border border-background-600 rounded-xl overflow-hidden mb-3'
            : 'border border-background-700 rounded-lg overflow-hidden mb-2 ml-6'
        }
      >
        {/* Group Header */}
        <div className="flex items-center justify-between px-3.5 py-3 bg-background-800 cursor-pointer hover:bg-background-700 transition-colors">
          <div className="flex items-center gap-2.5 flex-1 min-w-0" onClick={() => toggleGroupExpanded(group.id)}>
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[11.5px] font-bold shrink-0"
              style={allDone ? { background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' } : { background: stageColor.bg, color: stageColor.fg }}
            >
              {allDone ? '✓' : ordinal}
            </span>
            {isEditing ? (
              <input
                type="text"
                value={editingGroupTitle}
                onChange={(e) => setEditingGroupTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateGroupTitle(group.id);
                  if (e.key === 'Escape') {
                    setEditingGroupId(null);
                    setEditingGroupTitle('');
                  }
                }}
                className="flex-1 px-2 py-1 bg-background-900 border border-primary-500 rounded text-text-900 text-sm focus:outline-none"
                autoFocus
              />
            ) : (
              <div className="min-w-0">
                <span className="block font-[650] text-[13.5px] text-text-900 truncate">{group.groupTitle}</span>
                {group.groupDescription && (
                  <span className="block text-[11.5px] text-text-500 truncate">{group.groupDescription}</span>
                )}
              </div>
            )}
            <span
              className="text-[11px] font-[650] px-2 py-0.5 rounded-full tabular-nums whitespace-nowrap ml-1"
              style={
                allDone
                  ? { background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }
                  : { background: 'var(--color-background-700)', border: '1px solid var(--color-background-600)', color: 'var(--color-text-700)' }
              }
            >
              {group.completedTasks}/{group.totalTasks} done
            </span>
            {group.totalTasks > 0 && !allDone && (
              <div className="w-16 h-1.5 bg-background-700 rounded-full overflow-hidden ml-1 hidden sm:block">
                <div className="h-full bg-primary-500 transition-all rounded-full" style={{ width: `${groupProgress}%` }} />
              </div>
            )}
            <ChevronDown
              className={`w-4 h-4 text-text-500 shrink-0 ml-1 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
            />
          </div>
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateGroupTitle(group.id);
                  }}
                  className="p-1.5 text-green-400 hover:text-green-300 transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingGroupId(null);
                    setEditingGroupTitle('');
                  }}
                  className="p-1.5 text-text-600 hover:text-text-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingGroupId(group.id);
                    setEditingGroupTitle(group.groupTitle);
                  }}
                  className="p-1.5 text-text-600 hover:text-text-900 transition-colors"
                  title="Edit group"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGroup(group.id);
                  }}
                  className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                  title="Delete group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Group Content (Tasks) */}
        {isExpanded && (
          <div className="bg-background-900">
            {group.tasks && group.tasks.length > 0 ? (
              group.tasks.map(task => renderTask(task))
            ) : (
              <div className="p-4 pl-10 text-center text-text-500 text-sm border-t border-background-700">
                No tasks in this group yet
              </div>
            )}

            {/* Sub-stages sit below this stage's own tasks, so direct work is not buried. */}
            {subGroups.length > 0 && (
              <div className="pt-2 pb-1 border-t border-background-700">
                {subGroups.map((sub, subIdx) => renderGroup(sub, subIdx, depth + 1, idx))}
              </div>
            )}

            {/* Add Task Form or Button */}
            {showAddTaskFormForGroup === group.id ? (
              renderAddTaskForm(group.id)
            ) : (
              <button
                onClick={() => setShowAddTaskFormForGroup(group.id)}
                className="w-full p-2 pl-10 text-sm text-primary-400 hover:text-primary-300 hover:bg-background-800 transition-colors flex items-center gap-2 border-t border-background-700"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            )}

            {/* Only a stage may gain sub-stages; the backend refuses a third level. */}
            {depth === 0 && addingSubStageFor === group.id ? (
              <div className="flex items-center gap-2 p-2 pl-10 border-t border-background-700 bg-background-800">
                <input
                  autoFocus
                  value={newSubStageTitle}
                  onChange={(e) => setNewSubStageTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateSubStage(group.id);
                    if (e.key === 'Escape') { setAddingSubStageFor(null); setNewSubStageTitle(''); }
                  }}
                  placeholder="Sub-stage name, e.g. Cabinet production"
                  className="flex-1 h-[32px] px-2.5 rounded-lg border border-background-500 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600"
                />
                <button
                  onClick={() => handleCreateSubStage(group.id)}
                  className="h-[32px] px-3 rounded-lg text-[12.5px] font-semibold"
                  style={{ background: 'var(--color-primary-600)', color: 'var(--on-accent)' }}
                >
                  Add
                </button>
                <button
                  onClick={() => { setAddingSubStageFor(null); setNewSubStageTitle(''); }}
                  className="h-[32px] px-3 rounded-lg text-[12.5px] text-text-600 hover:text-text-900"
                >
                  Cancel
                </button>
              </div>
            ) : depth === 0 ? (
              <button
                onClick={() => setAddingSubStageFor(group.id)}
                className="w-full p-2 pl-10 text-sm text-text-500 hover:text-text-800 hover:bg-background-800 transition-colors flex items-center gap-2 border-t border-background-700"
              >
                <Plus className="w-4 h-4" />
                Add sub-stage
              </button>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-900">Task Checklist</h3>
        <div className="text-sm text-text-600">
          {completedTasks}/{totalTasks} tasks completed
        </div>
      </div>

      {/* Loading State */}
      {isLoadingGroups ? (
        <div className="p-8 text-center border border-background-600 rounded-lg">
          <Loader2 className="w-6 h-6 text-primary-500 animate-spin mx-auto" />
          <p className="mt-2 text-text-600">Loading tasks...</p>
        </div>
      ) : taskGroups.length === 0 && !showAddGroupForm ? (
        /* Empty state: jobs created before the checklist existed get it in one click. */
        <div className="p-8 text-center border border-dashed border-background-500 rounded-xl">
          <ListChecks className="w-8 h-8 text-text-500 mx-auto mb-2" />
          <p className="text-text-900 font-semibold text-sm">This job has no stage checklist yet</p>
          <p className="text-text-600 text-[12.5px] mt-1 mb-4">
            Apply the standard 3-stage checklist (36 tasks), or build the groups by hand.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleApplyStandard}
              disabled={isApplying}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListChecks className="w-4 h-4" />}
              Apply standard stages
            </button>
            <button
              onClick={() => setShowAddGroupForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-background-500 text-text-900 rounded-lg hover:bg-background-700 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              Add group manually
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Task Groups */}
          {taskGroups.map((group, idx) => renderGroup(group, idx))}

          {/* Add Group Form */}
          {showAddGroupForm ? (
            <div className="p-4 bg-background-800 rounded-lg border border-background-600 space-y-3">
              <input
                type="text"
                placeholder="Group title (e.g., Production Phase, Installation) *"
                value={newGroup.groupTitle}
                onChange={(e) => setNewGroup({ ...newGroup, groupTitle: e.target.value })}
                className="w-full px-3 py-2 bg-background-900 border border-background-600 rounded-lg text-text-900 placeholder-text-500 focus:outline-none focus:border-primary-500"
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newGroup.groupDescription}
                onChange={(e) => setNewGroup({ ...newGroup, groupDescription: e.target.value })}
                className="w-full px-3 py-2 bg-background-900 border border-background-600 rounded-lg text-text-900 placeholder-text-500 focus:outline-none focus:border-primary-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowAddGroupForm(false);
                    setNewGroup({ groupTitle: '', groupDescription: '' });
                  }}
                  className="px-4 py-2 text-text-600 hover:text-text-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={isCreatingGroup || !newGroup.groupTitle.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreatingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Create Group
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddGroupForm(true)}
              className="w-full p-3 border border-dashed border-background-600 rounded-lg text-primary-400 hover:text-primary-300 hover:border-primary-500 transition-colors flex items-center justify-center gap-2"
            >
              <FolderPlus className="w-5 h-5" />
              Add New Group
            </button>
          )}
        </>
      )}

      {/* Progress Summary */}
      {totalTasks > 0 && (
        <div className="p-4 bg-background-800 rounded-lg border border-background-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-600">Overall Progress</span>
            <span className="text-lg font-bold text-text-900 tabular-nums">
              {completedTasks}/{totalTasks} · {progressPercentage}%
            </span>
          </div>
          <div className="h-3 bg-background-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Set-reminder dialog (task title pre-filled; day-granularity reminder) */}
      <Modal
        isOpen={reminderTask !== null}
        onClose={() => setReminderTask(null)}
        title="Set Reminder"
        size="md"
      >
        <ModalBody>
          <p className="text-[12.5px] text-text-600 mb-4">
            Shows for its whole day, from midnight — in the notification bell and on the Reminders page.
          </p>
          <div className="mb-4">
            <Input label="What is this reminder for?" type="text" value={reminderTask?.taskTitle ?? ''} readOnly />
          </div>
          <div className="mb-4">
            <Input label="Date *" type="date" value={remDate} onChange={(e) => setRemDate(e.target.value)} />
          </div>
          <Input
            label="Notes"
            type="text"
            value={remNotes}
            onChange={(e) => setRemNotes(e.target.value)}
            placeholder={reminderTask?.taskDescription || 'Optional details…'}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setReminderTask(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSetReminder} disabled={!remDate || isSettingReminder}>
            {isSettingReminder ? 'Saving…' : 'Set Reminder'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ProductionTaskChecklist;
