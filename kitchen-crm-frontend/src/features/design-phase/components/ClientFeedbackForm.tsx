/**
 * ClientFeedbackForm Component
 * Form for recording and managing client feedback
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { useRecordClientFeedbackMutation } from '@/features/design-phase/designPhaseApi';
import { type DesignPhase } from '@/features/design-phase/types';
import { MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ClientFeedbackFormProps {
  designPhase: DesignPhase;
  onUpdate: () => void;
}

export function ClientFeedbackForm({ designPhase, onUpdate }: ClientFeedbackFormProps) {
  const [recordFeedback, { isLoading }] = useRecordClientFeedbackMutation();
  
  const [feedbackForm, setFeedbackForm] = useState({
    clientFeedback: '',
    requiresRevision: false,
    revisionNotes: '',
  });

  const handleSubmitFeedback = async () => {
    try {
      await recordFeedback({
        customerId: designPhase.customerId,
        feedbackData: feedbackForm
      }).unwrap();

      toast.success('Client feedback recorded successfully');
      setFeedbackForm({
        clientFeedback: '',
        requiresRevision: false,
        revisionNotes: '',
      });
      onUpdate();
    } catch (error) {
      toast.error('Failed to record client feedback');
      console.error('Error recording feedback:', error);
    }
  };

  const handleReset = () => {
    setFeedbackForm({
      clientFeedback: '',
      requiresRevision: false,
      revisionNotes: '',
    });
  };

  const getFeedbackSentiment = (feedback: string) => {
    const positiveWords = ['good', 'great', 'excellent', 'perfect', 'love', 'like', 'approve'];
    const negativeWords = ['bad', 'terrible', 'wrong', 'hate', 'dislike', 'reject', 'change'];
    
    const lowerFeedback = feedback.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerFeedback.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerFeedback.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const sentiment = getFeedbackSentiment(feedbackForm.clientFeedback);

  return (
    <div className="space-y-6">
      {/* Current Feedback */}
      {designPhase.clientFeedback && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-text-900">Current Feedback</h3>
          </div>

          <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary-500 mt-1" />
              <div className="flex-1">
                <p className="text-text-700 mb-2">{designPhase.clientFeedback}</p>
                <div className="flex items-center gap-4 text-sm text-text-600">
                  <span>Received: {designPhase.feedbackDate ? new Date(designPhase.feedbackDate).toLocaleDateString() : 'Unknown'}</span>
                  {designPhase.revisionCount > 0 && (
                    <span>Revisions: {designPhase.revisionCount}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Feedback Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Record Client Feedback</h3>
        
        <div className="space-y-6">
          {/* Feedback Text */}
          <div>
            <label className="block text-sm font-medium text-text-700 mb-2">
              Client Feedback
            </label>
            <TextArea
              value={feedbackForm.clientFeedback}
              onChange={(e) => setFeedbackForm(prev => ({ ...prev, clientFeedback: e.target.value }))}
              placeholder="Enter client feedback, comments, and suggestions..."
              rows={5}
            />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-text-600">Sentiment:</span>
              <div className="flex items-center gap-1">
                {sentiment === 'positive' && (
                  <>
                    <ThumbsUp className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">Positive</span>
                  </>
                )}
                {sentiment === 'negative' && (
                  <>
                    <ThumbsDown className="h-4 w-4 text-error" />
                    <span className="text-sm text-error">Negative</span>
                  </>
                )}
                {sentiment === 'neutral' && (
                  <>
                    <MessageSquare className="h-4 w-4 text-text-500" />
                    <span className="text-sm text-text-500">Neutral</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Revision Required */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Checkbox
                checked={feedbackForm.requiresRevision}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, requiresRevision: e.target.checked }))}
              />
              <label className="text-sm font-medium text-text-700">
                Requires Revision
              </label>
            </div>
            <p className="text-sm text-text-600">
              Check this if the client requests changes to the design
            </p>
          </div>

          {/* Revision Notes */}
          {feedbackForm.requiresRevision && (
            <div>
              <label className="block text-sm font-medium text-text-700 mb-2">
                Revision Notes
              </label>
              <TextArea
                value={feedbackForm.revisionNotes}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, revisionNotes: e.target.value }))}
                placeholder="Specify what changes are needed..."
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-background-600">
            <Button
              onClick={handleSubmitFeedback}
              disabled={!feedbackForm.clientFeedback || isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Recording...' : 'Record Feedback'}
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset Form
            </Button>
          </div>
        </div>
      </Card>

      {/* Feedback Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Feedback Templates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-text-900">Positive Feedback</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeedbackForm(prev => ({ 
                  ...prev, 
                  clientFeedback: 'The design looks great! We love the layout and color scheme. Please proceed with the final version.' 
                }))}
                className="w-full text-left justify-start"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approved - Proceed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeedbackForm(prev => ({ 
                  ...prev, 
                  clientFeedback: 'Excellent work! The design meets all our requirements. Minor adjustments needed.' 
                }))}
                className="w-full text-left justify-start"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approved - Minor Changes
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-text-900">Revision Required</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeedbackForm(prev => ({ 
                  ...prev, 
                  clientFeedback: 'The design needs some adjustments. Please revise the layout and color scheme.',
                  requiresRevision: true,
                  revisionNotes: 'Change layout and color scheme'
                }))}
                className="w-full text-left justify-start"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Layout Changes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeedbackForm(prev => ({ 
                  ...prev, 
                  clientFeedback: 'Good progress, but we need to modify the dimensions and add more storage options.',
                  requiresRevision: true,
                  revisionNotes: 'Modify dimensions and add storage'
                }))}
                className="w-full text-left justify-start"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Dimension Changes
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Feedback History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Feedback History</h3>
        
        <div className="space-y-3">
          {designPhase.clientFeedback ? (
            <div className="flex items-start gap-3 p-3 bg-background-800 border border-background-600 rounded-lg">
              <MessageSquare className="h-4 w-4 text-text-600 mt-1" />
              <div className="flex-1">
                <p className="text-text-900 font-medium mb-1">Latest Feedback</p>
                <p className="text-text-700 text-sm mb-2">{designPhase.clientFeedback}</p>
                <div className="flex items-center gap-4 text-xs text-text-600">
                  <span>{designPhase.feedbackDate ? new Date(designPhase.feedbackDate).toLocaleDateString() : 'Unknown date'}</span>
                  <span>Revisions: {designPhase.revisionCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-text-400 mx-auto mb-4" />
              <p className="text-text-600">No feedback recorded yet</p>
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
              // Send feedback request to client
              toast.success('Feedback request sent to client');
            }}
            className="flex items-center gap-2 justify-start"
          >
            <MessageSquare className="h-4 w-4" />
            Request Feedback
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              // Generate feedback summary
              toast.success('Feedback summary generated');
            }}
            className="flex items-center gap-2 justify-start"
          >
            <AlertCircle className="h-4 w-4" />
            Generate Summary
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ClientFeedbackForm;
