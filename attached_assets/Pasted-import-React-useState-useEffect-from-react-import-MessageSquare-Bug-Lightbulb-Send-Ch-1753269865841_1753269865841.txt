import React, { useState, useEffect } from 'react';
import { MessageSquare, Bug, Lightbulb, Send, CheckCircle, AlertCircle, Star } from 'lucide-react';
import axios from 'axios';
import { getCurrentUserId } from '../utils/userSession';

interface FeedbackItem {
  id: number;
  userId: number;
  type: 'bug' | 'feature' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'submitted' | 'reviewed' | 'in_progress' | 'resolved';
  rating?: number;
  createdAt: string;
}

const FeedbackSystem: React.FC = () => {
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [rating, setRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userFeedback, setUserFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  const userId = getCurrentUserId();

  useEffect(() => {
    loadUserFeedback();
  }, []);

  const loadUserFeedback = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/feedback/${userId}`);
      setUserFeedback(response.data.feedback || []);
    } catch (error) {
      console.error('Failed to load feedback history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      const feedbackData = {
        userId,
        feedbackType,
        title: title.trim(),
        description: description.trim(),
        priority,
        rating: feedbackType === 'general' ? rating : undefined
      };

      await axios.post('/api/feedback', feedbackData);
      
      setSubmitted(true);
      setTitle('');
      setDescription('');
      setRating(0);
      setPriority('medium');
      
      // Reload feedback history
      loadUserFeedback();
      
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="text-red-500" size={20} />;
      case 'feature': return <Lightbulb className="text-yellow-500" size={20} />;
      default: return <MessageSquare className="text-blue-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'theme-text-secondary';
      case 'reviewed': return 'text-blue-400';
      case 'in_progress': return 'text-yellow-400';
      case 'resolved': return 'text-green-400';
      default: return 'theme-text-secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/20';
      default: return 'theme-text-secondary theme-surface';
    }
  };

  return (
    <div className="min-h-screen theme-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className="mr-3 theme-text" size={32} />
            <h1 className="text-3xl font-bold theme-text font-serif">Feedback & Suggestions</h1>
          </div>
          <p className="theme-text-secondary text-lg leading-relaxed max-w-2xl mx-auto">
            Help us improve TraI by sharing your thoughts, reporting bugs, or suggesting new features. 
            Your feedback is invaluable in making this a better wellness companion for everyone.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex theme-surface rounded-lg p-1 border border-[var(--theme-accent)]/30">
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'submit'
                  ? 'bg-[var(--theme-accent)] text-white shadow-sm'
                  : 'theme-text-secondary hover:theme-text'
              }`}
            >
              Submit Feedback
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-[var(--theme-accent)] text-white shadow-sm'
                  : 'theme-text-secondary hover:theme-text'
              }`}
            >
              My Feedback ({userFeedback.length})
            </button>
          </div>
        </div>

        {activeTab === 'submit' && (
          <div className="max-w-2xl mx-auto">
            {submitted && (
              <div className="mb-6 p-4 theme-surface border border-green-400/50 rounded-lg flex items-center">
                <CheckCircle className="text-green-400 mr-3" size={20} />
                <span className="theme-text">Thank you! Your feedback has been submitted successfully.</span>
              </div>
            )}

            <div className="theme-card rounded-xl p-8 border border-[var(--theme-accent)]/30 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Feedback Type Selection */}
                <div>
                  <label className="block theme-text text-sm font-medium mb-3">Feedback Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'general', label: 'General Feedback', icon: MessageSquare, color: 'blue' },
                      { value: 'bug', label: 'Bug Report', icon: Bug, color: 'red' },
                      { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'yellow' }
                    ].map(({ value, label, icon: Icon, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFeedbackType(value as any)}
                        className={`p-4 rounded-lg border-2 transition-all text-center theme-surface hover-lift ${
                          feedbackType === value
                            ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20'
                            : 'border-[var(--theme-accent)]/30 hover:border-[var(--theme-accent)]/50'
                        }`}
                      >
                        <Icon className={`mx-auto mb-2 text-${color}-500`} size={24} />
                        <div className="text-sm font-medium theme-text">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block theme-text text-sm font-medium mb-2">
                    {feedbackType === 'bug' ? 'Bug Summary' : 
                     feedbackType === 'feature' ? 'Feature Title' : 'Feedback Title'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      feedbackType === 'bug' ? 'Brief description of the bug...' :
                      feedbackType === 'feature' ? 'What feature would you like to see?' :
                      'What would you like to share?'
                    }
                    className="w-full p-3 rounded-lg border-2 border-[var(--theme-accent)]/30 focus:border-[var(--theme-accent)] theme-surface theme-text"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block theme-text text-sm font-medium mb-2">
                    {feedbackType === 'bug' ? 'Steps to Reproduce / Details' : 'Description'}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      feedbackType === 'bug' ? 'Please describe the bug in detail, including steps to reproduce it...' :
                      feedbackType === 'feature' ? 'Describe the feature and how it would help you...' :
                      'Share your thoughts, suggestions, or feedback...'
                    }
                    rows={6}
                    className="w-full p-3 rounded-lg border-2 border-[var(--theme-accent)]/30 focus:border-[var(--theme-accent)] theme-surface theme-text resize-none"
                    required
                  />
                </div>

                {/* Priority (for bugs and features) */}
                {(feedbackType === 'bug' || feedbackType === 'feature') && (
                  <div>
                    <label className="block theme-text text-sm font-medium mb-2">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full p-3 rounded-lg border-2 border-[var(--theme-accent)]/30 focus:border-[var(--theme-accent)] theme-surface theme-text"
                    >
                      <option value="low">Low - Minor issue or nice-to-have</option>
                      <option value="medium">Medium - Noticeable issue or useful feature</option>
                      <option value="high">High - Major issue or important feature</option>
                    </select>
                  </div>
                )}

                {/* Rating (for general feedback) */}
                {feedbackType === 'general' && (
                  <div>
                    <label className="block theme-text text-sm font-medium mb-2">Overall Rating (Optional)</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= rating ? 'text-[var(--theme-accent)] fill-[var(--theme-accent)]' : 'theme-text-secondary'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !description.trim()}
                  className="w-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent)] text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" size={18} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-accent)] mx-auto mb-4"></div>
                <div className="theme-text">Loading your feedback...</div>
              </div>
            ) : userFeedback.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto mb-4 theme-text-secondary" size={48} />
                <div className="theme-text text-lg mb-2">No feedback submitted yet</div>
                <div className="theme-text-secondary">Click "Submit Feedback" to share your thoughts!</div>
              </div>
            ) : (
              <div className="space-y-4">
                {userFeedback.map((feedback) => (
                  <div key={feedback.id} className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        {getTypeIcon(feedback.feedbackType)}
                        <h3 className="theme-text font-semibold ml-2">{feedback.title}</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                          {feedback.priority.toUpperCase()}
                        </span>
                        <span className={`text-sm font-medium ${getStatusColor(feedback.status)}`}>
                          {feedback.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <p className="theme-text-secondary mb-3">{feedback.description}</p>
                    
                    <div className="flex items-center justify-between text-sm theme-text-secondary">
                      <span>Submitted: {new Date(feedback.createdAt).toLocaleDateString()}</span>
                      {feedback.rating && (
                        <div className="flex items-center">
                          <span className="mr-1">Rating:</span>
                          {[...Array(feedback.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-[var(--theme-accent)] fill-[var(--theme-accent)]" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackSystem;