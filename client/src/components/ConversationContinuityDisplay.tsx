import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MessageCircle, ArrowRight, Brain, Sparkles, Calendar, GitBranch } from 'lucide-react';

interface ConversationSession {
  id: number;
  title: string;
  summary: string;
  keyTopics: string[];
  emotionalTone: string;
  messageCount: number;
  lastActivity: string;
  isActive: boolean;
  topicsSummary?: string;
  endTime?: string;
  keyInsights?: string[];
}

interface ConversationThread {
  id: number;
  topic: string;
  status: 'active' | 'resolved' | 'dormant' | 'follow_up_needed';
  priority: 'high' | 'medium' | 'low';
  contextSummary: string;
  nextSessionPrompt?: string;
  lastMentioned: string;
  context?: string;
}

interface ContinuityData {
  recentSessions: ConversationSession[];
  activeThreads: ConversationThread[];
  continuityItems: any[];
  sessionContext: {
    openingContext: string;
    continuityPrompts: string[];
    activeTopics: string[];
  };
}

const ConversationContinuityDisplay: React.FC = () => {
  const [continuityData, setContinuityData] = useState<ContinuityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContinuityData();
  }, []);

  const fetchContinuityData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/memory/conversation-continuity?userId=20');
      if (!response.ok) {
        throw new Error('Failed to fetch continuity data');
      }
      const data = await response.json();
      
      // If there's an error but the response has valid structure, use it
      if (data.error && data.recentSessions && data.activeThreads) {
        setContinuityData({
          recentSessions: data.recentSessions,
          activeThreads: data.activeThreads,
          continuityItems: data.continuityItems || [],
          sessionContext: data.sessionContext || {
            openingContext: 'ChakrAI conversation system ready',
            continuityPrompts: [],
            activeTopics: []
          }
        });
      } else {
        setContinuityData(data);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching continuity data:', err);
      // Set fallback data to prevent component crash
      setContinuityData({
        recentSessions: [],
        activeThreads: [],
        continuityItems: [],
        sessionContext: {
          openingContext: 'ChakrAI conversation system ready',
          continuityPrompts: [],
          activeTopics: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getEmotionalToneColor = (tone: string) => {
    switch (tone?.toLowerCase()) {
      case 'hopeful': return 'bg-green-100 text-green-800 border-green-200';
      case 'struggling': return 'bg-red-100 text-red-800 border-red-200';
      case 'breakthrough': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'concerned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'resolved': return 'bg-blue-100 text-blue-800';
      case 'follow_up_needed': return 'bg-orange-100 text-orange-800';
      case 'dormant': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Conversation Continuity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Brain className="w-5 h-5" />
            Conversation Continuity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error loading continuity data: {error}</p>
          <Button onClick={fetchContinuityData} className="mt-2" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!continuityData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Conversation Continuity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No conversation history available yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Start chatting to build cross-session conversation continuity.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Conversation Continuity
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {continuityData?.recentSessions?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Recent Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {continuityData?.activeThreads?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Active Threads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {continuityData?.sessionContext?.activeTopics?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Ongoing Topics</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      {(continuityData?.recentSessions?.length || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(continuityData?.recentSessions || []).slice(0, 3).map((session) => (
                <div key={session.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{session.topicsSummary || session.title || 'Conversation Session'}</h4>
                      <p className="text-sm text-gray-600 mt-1">{session.summary || 'Session summary not available'}</p>
                    </div>
                    <Badge className={getEmotionalToneColor(session.emotionalTone)}>
                      {session.emotionalTone}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {session.messageCount || 0} messages
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTimeAgo(session.lastActivity || session.endTime || new Date().toISOString())}
                    </div>
                  </div>

                  {(session.keyTopics?.length || session.keyInsights?.length || 0) > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(session.keyTopics || session.keyInsights || []).slice(0, 4).map((topic, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {(session.keyTopics || session.keyInsights || []).length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(session.keyTopics || session.keyInsights || []).length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Conversation Threads */}
      {(continuityData?.activeThreads?.length || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Active Conversation Threads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(continuityData?.activeThreads || []).map((thread) => (
                <div key={thread.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{thread.topic}</h4>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(thread.priority)}`} />
                        <Badge className={getStatusColor(thread.status)} variant="secondary">
                          {thread.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{thread.contextSummary || thread.context || 'Thread context not available'}</p>
                    </div>
                  </div>

                  {thread.nextSessionPrompt && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-blue-700 font-medium text-sm">
                        <ArrowRight className="w-4 h-4" />
                        Follow-up Suggestion
                      </div>
                      <p className="text-blue-700 text-sm mt-1">{thread.nextSessionPrompt}</p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Last mentioned: {formatTimeAgo(thread.lastMentioned)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cross-Session Context */}
      {continuityData?.sessionContext?.openingContext && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Cross-Session Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {continuityData?.sessionContext?.openingContext}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConversationContinuityDisplay;
