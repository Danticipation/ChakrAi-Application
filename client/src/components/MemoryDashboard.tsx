import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, RefreshCw, Calendar, MessageCircle, TrendingUp, Users, Clock, Lightbulb } from 'lucide-react';
import { getCurrentUserId } from '../utils/userSession';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface MemoryDashboard {
  summary?: {
    totalMemories: number;
    activeMemories: number;
    conversationSessions: number;
    memoryConnections: number;
    lastMemoryDate: string;
  };
  stats?: {
    totalMemories: number;
    activeMemories: number;
    connectionCount: number;
    insightCount: number;
    topTopics: Array<{
      topic: string;
      count: number;
    }>;
  };
  memories?: Array<{
    id: number;
    content: string;
    emotionalContext?: string;
    temporalContext?: string;
    semanticTags?: string[];
    topics?: string[];
    accessCount: number;
    createdAt: string;
  }>;
  recentMemories?: Array<{
    id: number;
    content: string;
    emotionalContext?: string;
    temporalContext?: string;
    topics?: string[];
    semanticTags?: string[];
    accessCount: number;
    createdAt: string;
  }>;
  topTopics?: Array<{
    topic: string;
    count: number;
    recentMention?: string;
  }>;
  memoryInsights?: Array<{
    type: string;
    insight: string;
    confidence: number;
    generatedAt: string;
  }>;
  insights?: Array<{
    type: string;
    insight: string;
    confidence: number;
    generatedAt: string;
  }>;
  emotionalPatterns?: Array<{
    timeframe: string;
    dominantEmotion: string;
    intensity: number;
    memoryCount: number;
  }>;
}

export default function MemoryDashboard() {
  const [refreshing, setRefreshing] = useState(false);

  // Get current user ID from session context
  const currentUserId = getCurrentUserId();

  const { data: dashboard, isLoading, refetch } = useQuery<MemoryDashboard>({
    queryKey: ['/api/memory-dashboard', currentUserId],
    queryFn: async () => {
      console.log(`🔍 Frontend fetching memory dashboard for user ID: ${currentUserId}`);
      const response = await fetch(`/api/memory-dashboard?userId=${currentUserId}`);
      const data = await response.json();
      console.log(`📊 Frontend received dashboard data:`, data);
      return data;
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEmotionalColor = (emotion: string) => {
    const colors = {
      positive: 'bg-green-100 text-green-800',
      negative: 'bg-red-100 text-red-800',
      neutral: 'bg-gray-100 text-gray-800',
      anxious: 'bg-yellow-100 text-yellow-800',
      excited: 'bg-blue-100 text-blue-800'
    };
    return colors[emotion.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen theme-primary p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3 text-white">Loading memory dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-primary p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Insight Vault</h1>
              <p className="text-white/80">A secure space for your emotional and cognitive patterns</p>
            </div>
          </div>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="theme-card hover:theme-primary text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="theme-card rounded-lg border border-silver hover:border-2 hover:animate-shimmer">
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm text-white/80">Total Reflections</p>
                  <p className="text-2xl font-bold text-white">{dashboard?.summary?.totalMemories || dashboard?.stats?.totalMemories || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="theme-card rounded-lg border border-silver hover:border-2 hover:animate-shimmer">
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm text-white/80">Active Threads</p>
                  <p className="text-2xl font-bold text-white">{dashboard?.summary?.activeMemories || dashboard?.stats?.activeMemories || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="theme-card rounded-lg border border-silver hover:border-2 hover:animate-shimmer">
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm text-white/80">Conversations</p>
                  <p className="text-2xl font-bold text-white">{dashboard?.summary?.conversationSessions || dashboard?.stats?.connectionCount || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="theme-card rounded-lg border border-silver hover:border-2 hover:animate-shimmer">
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-white" />
                <div>
                  <p className="text-sm text-white/80">Last Insight</p>
                  <p className="text-sm font-medium text-white">{dashboard?.summary?.lastMemoryDate ? formatDate(dashboard.summary.lastMemoryDate) : 'None yet'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Memories and Top Topics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Memories */}
          <div className="theme-card rounded-lg border border-silver hover:border-2 hover:animate-shimmer">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle className="w-5 h-5 text-white" />
                <span className="text-lg font-semibold text-white">Recent Reflections</span>
              </div>
              <p className="text-white/80 mb-6">Latest conversations and insights</p>
              <div className="space-y-4">
                {(dashboard?.recentMemories || dashboard?.memories)?.slice(0, 5).map((memory) => (
                  <div key={memory.id} className="border border-white/30 rounded-lg p-3 theme-primary">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-white/20 text-white border-white/30">
                        {memory.emotionalContext || 'neutral'}
                      </Badge>
                      <span className="text-xs text-white/60">{formatDate(memory.createdAt)}</span>
                    </div>
                    <p className="text-sm text-white mb-2">{memory.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {(memory.topics || memory.semanticTags)?.slice(0, 3).map((topic: string, index: number) => (
                          <Badge key={index} className="bg-white/10 text-white/80 border-white/30 text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-xs text-white/60">
                        Accessed {memory.accessCount} times
                      </span>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-white/60">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No reflections yet. Start a conversation to build your insight profile!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Topics */}
          <div className="theme-card rounded-lg border border-silver hover:border-2 hover:animate-shimmer">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-white" />
                <span className="text-lg font-semibold text-white">Recurring Themes</span>
              </div>
              <p className="text-white/80 mb-6">Most discussed themes in our reflective conversations</p>
              <div className="space-y-3">
                {(dashboard?.topTopics || dashboard?.stats?.topTopics)?.slice(0, 6).map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white">{topic.topic}</span>
                        <span className="text-sm text-white/60">{topic.count} mentions</span>
                      </div>
                      <Progress value={(topic.count / (dashboard?.topTopics?.[0]?.count || 1)) * 100} className="h-2" />
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-white/60">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Themes will appear as we have more reflective conversations</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Memory Insights */}
          <div className="theme-card rounded-lg border border-silver hover:border-2 hover:animate-shimmer">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-5 h-5 text-white" />
                <span className="text-lg font-semibold text-white">Cognitive Insights</span>
              </div>
              <p className="text-white/80 mb-6">Patterns and insights from your reflective conversations</p>
              <div className="space-y-4">
                {(dashboard?.memoryInsights || dashboard?.insights)?.slice(0, 4).map((insight, index) => (
                  <div key={index} className="border border-white/30 rounded-lg p-3 theme-primary">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-white/20 text-white border-white/30">{insight.type}</Badge>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                        <span className="text-xs text-white/60">{Math.round(insight.confidence * 100)}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-white">{insight.insight}</p>
                  </div>
                )) || (
                  <div className="text-center py-8 text-white/60">
                    <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Cognitive insights will develop as we learn more about your patterns</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Emotional Patterns */}
          <div className="theme-card rounded-lg border border-silver hover:border-2 hover:animate-shimmer">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-white" />
                <span className="text-lg font-semibold text-white">Emotional Evolution</span>
              </div>
              <p className="text-white/80 mb-6">How your emotional state has evolved</p>
              <div className="space-y-4">
                {dashboard?.emotionalPatterns?.map((pattern, index) => (
                  <div key={index} className="border border-white/30 rounded-lg p-3 theme-primary">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{pattern.timeframe}</span>
                      <Badge className="bg-white/20 text-white border-white/30">
                        {pattern.dominantEmotion}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white/80">Intensity</span>
                          <span className="text-sm font-medium text-white">{Math.round(pattern.intensity * 100)}%</span>
                        </div>
                        <Progress value={pattern.intensity * 100} className="h-2" />
                      </div>
                      <div className="text-sm text-white/60">
                        {pattern.memoryCount} memories
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-white/60">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Emotional patterns will emerge from our conversations</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}