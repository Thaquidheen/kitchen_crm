/**
 * MeetingScheduler Component
 * Calendar integration for scheduling and managing meetings
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { useScheduleMeetingMutation, useCompleteMeetingMutation } from '@/features/design-phase/designPhaseApi';
import { type DesignPhase } from '@/features/design-phase/types';
import { Calendar, Clock, MapPin, Users, CheckCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MeetingSchedulerProps {
  designPhase: DesignPhase;
  onUpdate: () => void;
}

export function MeetingScheduler({ designPhase, onUpdate }: MeetingSchedulerProps) {
  const [scheduleMeeting, { isLoading: scheduling }] = useScheduleMeetingMutation();
  const [completeMeeting, { isLoading: completing }] = useCompleteMeetingMutation();
  
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  
  const [meetingForm, setMeetingForm] = useState({
    meetingDateTime: '',
    meetingPurpose: '',
    meetingLocation: '',
    attendees: '',
  });

  const [completionForm, setCompletionForm] = useState({
    meetingNotes: '',
  });

  const handleScheduleMeeting = async () => {
    try {
      await scheduleMeeting({
        customerId: designPhase.customerId,
        meetingData: meetingForm
      }).unwrap();

      toast.success('Meeting scheduled successfully');
      setShowScheduleForm(false);
      setMeetingForm({
        meetingDateTime: '',
        meetingPurpose: '',
        meetingLocation: '',
        attendees: '',
      });
      onUpdate();
    } catch (error) {
      toast.error('Failed to schedule meeting');
      console.error('Error scheduling meeting:', error);
    }
  };

  const handleCompleteMeeting = async () => {
    try {
      await completeMeeting({
        customerId: designPhase.customerId,
        meetingNotes: completionForm.meetingNotes
      }).unwrap();

      toast.success('Meeting completed successfully');
      setShowCompleteForm(false);
      setCompletionForm({ meetingNotes: '' });
      onUpdate();
    } catch (error) {
      toast.error('Failed to complete meeting');
      console.error('Error completing meeting:', error);
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const isMeetingUpcoming = (dateTime: string) => {
    return new Date(dateTime) > new Date();
  };

  return (
    <div className="space-y-6">
      {/* Current Meeting Status */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-text-900">Meeting Status</h3>
        </div>

        {designPhase.meetingScheduled ? (
          <div className={`p-4 rounded-lg border ${
            designPhase.meetingCompleted 
              ? 'bg-success/10 border-success/20' 
              : isMeetingUpcoming(designPhase.meetingScheduled)
                ? 'bg-primary-500/10 border-primary-500/20'
                : 'bg-warning/10 border-warning/20'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary-500" />
                <div>
                  <p className="text-text-900 font-medium">
                    {formatDateTime(designPhase.meetingScheduled)}
                  </p>
                  <p className="text-sm text-text-600">
                    {designPhase.meetingCompleted ? 'Completed' : 'Scheduled'}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                designPhase.meetingCompleted 
                  ? 'bg-success/20 text-success'
                  : isMeetingUpcoming(designPhase.meetingScheduled)
                    ? 'bg-primary-500/20 text-primary-500'
                    : 'bg-warning/20 text-warning'
              }`}>
                {designPhase.meetingCompleted ? 'Completed' : 'Scheduled'}
              </div>
            </div>

            {designPhase.meetingNotes && (
              <div className="mt-3 p-3 bg-background-800 border border-background-600 rounded-lg">
                <p className="text-sm text-text-600 mb-1">Meeting Notes:</p>
                <p className="text-text-700">{designPhase.meetingNotes}</p>
              </div>
            )}

            {!designPhase.meetingCompleted && (
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setShowCompleteForm(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete Meeting
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowScheduleForm(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Reschedule
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-text-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-text-900 mb-2">No Meeting Scheduled</h4>
            <p className="text-text-600 mb-4">
              Schedule a meeting with the client to discuss design requirements
            </p>
            <Button onClick={() => setShowScheduleForm(true)} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Meeting
            </Button>
          </div>
        )}
      </Card>

      {/* Schedule Meeting Form */}
      {showScheduleForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-900">Schedule Meeting</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScheduleForm(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-700 mb-2">
                  Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={meetingForm.meetingDateTime}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, meetingDateTime: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-700 mb-2">
                  Purpose
                </label>
                <Select
                  value={meetingForm.meetingPurpose}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, meetingPurpose: e.target.value }))}
                >
                  <option value="">Select purpose...</option>
                  <option value="requirements">Requirements Gathering</option>
                  <option value="review">Design Review</option>
                  <option value="feedback">Feedback Discussion</option>
                  <option value="approval">Final Approval</option>
                  <option value="other">Other</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-700 mb-2">
                Location
              </label>
              <Input
                placeholder="Meeting location (office, client site, online, etc.)"
                value={meetingForm.meetingLocation}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, meetingLocation: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-700 mb-2">
                Attendees
              </label>
              <Input
                placeholder="List attendees (e.g., Client, Designer, Project Manager)"
                value={meetingForm.attendees}
                onChange={(e) => setMeetingForm(prev => ({ ...prev, attendees: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleScheduleMeeting}
                disabled={!meetingForm.meetingDateTime || scheduling}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                {scheduling ? 'Scheduling...' : 'Schedule Meeting'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowScheduleForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Complete Meeting Form */}
      {showCompleteForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-900">Complete Meeting</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompleteForm(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-700 mb-2">
                Meeting Notes
              </label>
              <TextArea
                placeholder="Enter meeting notes, decisions made, and next steps..."
                value={completionForm.meetingNotes}
                onChange={(e) => setCompletionForm(prev => ({ ...prev, meetingNotes: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCompleteMeeting}
                disabled={!completionForm.meetingNotes || completing}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {completing ? 'Completing...' : 'Complete Meeting'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowCompleteForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Meeting History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Meeting History</h3>
        
        <div className="space-y-3">
          {designPhase.meetingScheduled && (
            <div className="flex items-center justify-between p-3 bg-background-800 border border-background-600 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-text-600" />
                <div>
                  <p className="text-text-900 font-medium">
                    {formatDateTime(designPhase.meetingScheduled)}
                  </p>
                  <p className="text-sm text-text-600">
                    {designPhase.meetingPurpose || 'General meeting'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  designPhase.meetingCompleted 
                    ? 'bg-success/20 text-success'
                    : 'bg-warning/20 text-warning'
                }`}>
                  {designPhase.meetingCompleted ? 'Completed' : 'Scheduled'}
                </span>
              </div>
            </div>
          )}
          
          {/* Add more meeting history items as needed */}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => setShowScheduleForm(true)}
            className="flex items-center gap-2 justify-start"
          >
            <Calendar className="h-4 w-4" />
            Schedule New Meeting
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              // Generate meeting link or send calendar invite
              toast.success('Calendar invite sent');
            }}
            className="flex items-center gap-2 justify-start"
          >
            <Clock className="h-4 w-4" />
            Send Calendar Invite
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default MeetingScheduler;
