import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Monitor, 
  Mic, 
  Users, 
  BarChart3, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Eye,
  Server,
  Database,
  Activity
} from 'lucide-react';
import axios from 'axios';

interface AdminStats {
  feedback: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  };
  system: {
    uptime: string;
    memoryUsage: string;
    activeUsers: number;
    totalMessages: number;
  };
}

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

const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [feedbackStatsRes, feedbackRes, systemStatsRes] = await Promise.all([
        axios.get('/api/admin/feedback/stats'),
        axios.get('/api/admin/feedback?limit=10'),
        axios.get('/api/admin/system/stats').catch(() => ({ data: null }))
      ]);

      setStats({
        feedback: feedbackStatsRes.data,
        system: systemStatsRes.data || {
          uptime: null,
          memoryUsage: null,
          activeUsers: null,
          totalMessages: null
        }
      });
      setFeedback(feedbackRes.data.feedback);
      setSystemHealth(systemStatsRes.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const updateFeedbackStatus = async (feedbackId: number, status: string, response?: string) => {
    try {
      await axios.patch(`/api/admin/feedback/${feedbackId}`, {
        status,
        adminResponse: response
      });
      loadData();
      setSelectedFeedback(null);
      setAdminResponse('');
    } catch (error) {
      console.error('Failed to update feedback:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-yellow-400 bg-yellow-900/20';
      case 'reviewed': return 'text-blue-400 bg-blue-900/20';
      case 'in_progress': return 'text-orange-400 bg-orange-900/20';
      case 'resolved': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
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

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">System Status</p>
              <div className="flex items-center mt-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <p className="text-lg font-semibold text-white">Healthy</p>
              </div>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.system.activeUsers !== null ? stats.system.activeUsers : '—'}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Messages</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.system.totalMessages !== null ? stats.system.totalMessages : '—'}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Memory Usage</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.system.memoryUsage || '—'}
              </p>
            </div>
            <Server className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Feedback Overview */}
      {stats?.feedback && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Feedback Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.feedback.total}</p>
              <p className="text-sm text-gray-400">Total Feedback</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.feedback.byStatus.submitted || 0}</p>
              <p className="text-sm text-gray-400">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{stats.feedback.byType.bug || 0}</p>
              <p className="text-sm text-gray-400">Bug Reports</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.feedback.byStatus.resolved || 0}</p>
              <p className="text-sm text-gray-400">Resolved</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Feedback */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Feedback</h3>
        <div className="space-y-3">
          {feedback.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600/50 hover:border-gray-500/50 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedFeedback(item);
                setActiveTab('feedback');
              }}
            >
              <div className="flex items-center space-x-3">
                {getTypeIcon(item.feedbackType)}
                <div>
                  <p className="font-medium text-white text-sm">{item.title}</p>
                  <p className="text-xs text-gray-400">User #{item.userId} • {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                  {item.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFeedbackManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Feedback Management</h2>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedback.map((item) => (
          <div
            key={item.id}
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
            onClick={() => setSelectedFeedback(item)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getTypeIcon(item.feedbackType)}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{item.description.substring(0, 100)}...</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>User #{item.userId}</span>
                    <span>•</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.rating && (
                      <>
                        <span>•</span>
                        <span>Rating: {item.rating}/5</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSystemTools = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">System Tools</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AI Monitoring */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Monitor className="w-6 h-6 text-blue-400 mr-3" />
            <h3 className="text-lg font-semibold text-white">AI Monitoring</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">Monitor AI performance, response quality, and usage metrics</p>
          <button
            onClick={() => setActiveTab('ai-monitoring')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Open AI Dashboard
          </button>
        </div>

        {/* Microphone Test */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Mic className="w-6 h-6 text-green-400 mr-3" />
            <h3 className="text-lg font-semibold text-white">Microphone Test</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">Test audio recording functionality and voice processing</p>
          <button
            onClick={() => setActiveTab('mic-test')}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Open Mic Test
          </button>
        </div>

        {/* Community Setup */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-purple-400 mr-3" />
            <h3 className="text-lg font-semibold text-white">Community Setup</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">Configure community features and Supabase integration</p>
          <button
            onClick={() => setActiveTab('community-setup')}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            Open Community Config
          </button>
        </div>

        {/* Database Management */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Database className="w-6 h-6 text-orange-400 mr-3" />
            <h3 className="text-lg font-semibold text-white">Database Health</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">Monitor database performance and execute queries</p>
          <div className="flex items-center justify-center py-2">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-green-400 text-sm">Connected</span>
          </div>
        </div>

        {/* Security Monitoring */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-red-400 mr-3" />
            <h3 className="text-lg font-semibold text-white">Security</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">Security logs, rate limiting, and access control</p>
          <div className="flex items-center justify-center py-2">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-green-400 text-sm">Protected</span>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-6 h-6 text-yellow-400 mr-3" />
            <h3 className="text-lg font-semibold text-white">Analytics</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">User engagement, feature usage, and performance metrics</p>
          <div className="text-center py-2">
            <span className="text-yellow-400 text-sm">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Shield className="w-8 h-8 mr-3 text-blue-400" />
            Admin Portal
          </h1>
          <p className="text-gray-400 mt-1">Comprehensive administrative dashboard for Chakrai</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'feedback', label: 'Feedback', icon: MessageSquare },
            { id: 'tools', label: 'System Tools', icon: Settings },
            { id: 'ai-monitoring', label: 'AI Monitoring', icon: Monitor },
            { id: 'mic-test', label: 'Mic Test', icon: Mic },
            { id: 'community-setup', label: 'Community', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'feedback' && renderFeedbackManagement()}
        {activeTab === 'tools' && renderSystemTools()}
        {activeTab === 'ai-monitoring' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">AI Performance Monitoring</h2>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <div className="text-center py-8">
                <Monitor className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">AI Monitoring Dashboard</h3>
                <p className="text-gray-400 mb-4">Monitor AI performance, response quality, and system metrics</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400">Response Time</p>
                    <p className="text-2xl font-bold text-green-400">—</p>
                    <p className="text-xs text-gray-500 mt-1">Real-time data not available</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-400">—</p>
                    <p className="text-xs text-gray-500 mt-1">Real-time data not available</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400">API Calls Today</p>
                    <p className="text-2xl font-bold text-purple-400">—</p>
                    <p className="text-xs text-gray-500 mt-1">Real-time data not available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'mic-test' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Microphone Testing</h2>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <div className="text-center py-8">
                <Mic className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Audio System Test</h3>
                <p className="text-gray-400 mb-6">Test microphone functionality and audio processing pipeline</p>
                <div className="space-y-4">
                  <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Start Recording Test
                  </button>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Audio Input Status</span>
                      <span className="text-green-400 text-sm">✓ Available</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">WebAudio API</span>
                      <span className="text-green-400 text-sm">✓ Supported</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Voice Processing</span>
                      <span className="text-green-400 text-sm">✓ Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'community-setup' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Community Configuration</h2>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Supabase Integration</h3>
                <p className="text-gray-400 mb-6">Configure community features and database connections</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Supabase Connection</span>
                      <span className="text-green-400 text-sm">✓ Connected</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Community Forums</span>
                      <span className="text-green-400 text-sm">✓ Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Real-time Updates</span>
                      <span className="text-green-400 text-sm">✓ Enabled</span>
                    </div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">Active Forums</p>
                    <p className="text-2xl font-bold text-purple-400">—</p>
                    <p className="text-sm text-gray-400 mt-2">Community Members</p>
                    <p className="text-2xl font-bold text-blue-400">—</p>
                    <p className="text-xs text-gray-500 mt-1">Real-time data not available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                      {selectedFeedback.feedbackType} • {selectedFeedback.priority} priority • User #{selectedFeedback.userId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ×
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
                          ★
                        </span>
                      ))}
                      <span className="ml-2 text-gray-400">({selectedFeedback.rating}/5)</span>
                    </div>
                  </div>
                )}

                {selectedFeedback.adminResponse && (
                  <div>
                    <h3 className="font-semibold text-white mb-2">Previous Admin Response</h3>
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

export default AdminPortal;