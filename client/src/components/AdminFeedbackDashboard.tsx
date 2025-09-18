import React, { useState, useEffect } from 'react';
import { MessageSquare, Bug, Lightbulb, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import axios from 'axios';

interface FeedbackItem {
  id: number;
  userId: number;
  feedbackType: 'bug' | 'feature' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'submitted' | 'reviewed' | 'in_progress' | 'resolved';
  rating?: number;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

const AdminFeedbackDashboard: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      
      const response = await axios.get(`/api/admin/feedback?${params.toString()}`);
      setFeedback(response.data.feedback);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/admin/feedback/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load feedback stats:', error);
    }
  };

  useEffect(() => {
    loadFeedback();
    loadStats();
  }, [statusFilter, typeFilter, priorityFilter]);

  const updateFeedbackStatus = async (feedbackId: number, status: string, response?: string) => {
    try {
      await axios.patch(`/api/admin/feedback/${feedbackId}`, {
        status,
        adminResponse: response
      });
      
      // Refresh data
      loadFeedback();
      loadStats();
      setSelectedFeedback(null);
      setAdminResponse('');
    } catch (error) {
      console.error('Failed to update feedback:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4 text-red-400" />;
      case 'feature': return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      case 'general': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'reviewed': return <Eye className="w-4 h-4 text-blue-400" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  if (loading && feedback.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Feedback Management</h1>
          <p className="text-gray-400 mt-1">Review and manage user feedback, bug reports, and feature requests</p>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Feedback</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.byStatus['submitted'] || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <Bug className="w-8 h-8 text-red-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Bug Reports</p>
                <p className="text-2xl font-bold text-white">{stats.byType['bug'] || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <Lightbulb className="w-8 h-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Feature Requests</p>
                <p className="text-2xl font-bold text-white">{stats.byType['feature'] || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-gray-800/30 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-300">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 text-sm"
          >
            <option value="">All</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-300">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 text-sm"
          >
            <option value="">All</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="general">General</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-300">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 text-sm"
          >
            <option value="">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedback.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No feedback found with current filters</p>
          </div>
        ) : (
          feedback.map((item) => (
            <div
              key={item.id}
              className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
              onClick={() => setSelectedFeedback(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(item.feedbackType)}
                    {getStatusIcon(item.status)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>User #{item.userId}</span>
                      <span>â€¢</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      {item.rating && (
                        <>
                          <span>â€¢</span>
                          <span>Rating: {item.rating}/5</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'resolved' ? 'bg-green-900/20 text-green-400' :
                    item.status === 'in_progress' ? 'bg-orange-900/20 text-orange-400' :
                    item.status === 'reviewed' ? 'bg-blue-900/20 text-blue-400' :
                    'bg-yellow-900/20 text-yellow-400'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(selectedFeedback.feedbackType)}
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedFeedback.title}</h2>
                    <p className="text-gray-400 text-sm">
                      {selectedFeedback.feedbackType} â€¢ {selectedFeedback.priority} priority â€¢ User #{selectedFeedback.userId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="text-gray-400 hover:text-white"
                >
                  Ã—
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedFeedback.description}</p>
                </div>

                {selectedFeedback.rating && (
                  <div>
                    <h3 className="font-semibold text-white mb-2">Rating</h3>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={star <= selectedFeedback.rating! ? 'text-yellow-400' : 'text-gray-600'}
                        >
                          â˜…
                        </span>
                      ))}
                      <span className="ml-2 text-gray-400">({selectedFeedback.rating}/5)</span>
                    </div>
                  </div>
                )}

                {selectedFeedback.adminResponse && (
                  <div>
                    <h3 className="font-semibold text-white mb-2">Admin Response</h3>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <p className="text-gray-300 whitespace-pre-wrap">{selectedFeedback.adminResponse}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-white mb-2">Admin Response</h3>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Add your response to this feedback..."
                    className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400">
                    Submitted: {new Date(selectedFeedback.createdAt).toLocaleString()}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, 'reviewed', adminResponse)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, 'in_progress', adminResponse)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, 'resolved', adminResponse)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackDashboard;
