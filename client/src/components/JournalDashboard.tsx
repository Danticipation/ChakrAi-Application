import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, TrendingUp, Download, Calendar, Search, Filter, Edit3, Eye, Clock, BarChart3, Star, MessageCircle, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import JournalEditor from './JournalEditor';
import { format } from 'date-fns';

// Types based on actual database schema
interface JournalEntry {
  id: number;
  userId: number;
  title: string | null;
  content: string;
  mood: string | null;
  moodIntensity: number | null;
  tags: string[] | null;
  isPrivate: boolean | null;
  createdAt: Date | null;
}

interface JournalAnalytics {
  totalEntries: number;
  averageMoodIntensity: number;
  themes: Array<{ theme: string; count: number }>;
  sentimentTrend: 'positive' | 'neutral' | 'negative';
  writingStreak: number;
  averageWordsPerEntry: number;
}

interface JournalDashboardProps {
  userId: number;
}

// Utility Components
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-3">
    <Loader2 className="animate-spin theme-text-secondary" size={32} />
    <p className="text-sm theme-text-secondary">{message}</p>
  </div>
);

const ErrorMessage: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <AlertCircle className="theme-text-secondary" size={48} />
    <div className="text-center space-y-2">
      <p className="theme-text font-medium">Something went wrong</p>
      <p className="text-sm theme-text-secondary">{error}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center space-x-2 px-4 py-2 bg-[var(--theme-accent)] text-white rounded-lg hover:shadow-lg transition-all"
      >
        <RefreshCw size={16} />
        <span>Try Again</span>
      </button>
    )}
  </div>
);

const EmptyState: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  action?: React.ReactNode 
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center p-12 space-y-6">
    {icon}
    <div className="text-center space-y-2">
      <h3 className="text-lg font-semibold theme-text">{title}</h3>
      <p className="theme-text-secondary">{description}</p>
    </div>
    {action}
  </div>
);

// Helper function to determine if this is a fresh start
const useIsFreshStart = () => {
  const [isFreshStart, setIsFreshStart] = useState(false);
  
  useEffect(() => {
    const freshStart = localStorage.getItem('freshStart') === 'true';
    setIsFreshStart(freshStart);
    
    // Clean up fresh start flag after reading
    if (freshStart) {
      localStorage.removeItem('freshStart');
    }
  }, []);
  
  return isFreshStart;
};

// Main Component
export default function JournalDashboard({ userId }: JournalDashboardProps) {
  const [activeView, setActiveView] = useState<'list' | 'editor' | 'analytics'>('list');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [showEntryModal, setShowEntryModal] = useState(false);
  
  const queryClient = useQueryClient();
  const isFreshStart = useIsFreshStart();

  // Clear cache only when truly necessary (fresh start)
  useEffect(() => {
    if (isFreshStart) {
      queryClient.removeQueries({ queryKey: ['/api/journal'] });
      queryClient.removeQueries({ queryKey: ['/api/journal/analytics'] });
    }
  }, [isFreshStart, queryClient]);

  // Data fetching with proper typing
  const { 
    data: entries = [], 
    isLoading: entriesLoading, 
    error: entriesError,
    refetch: refetchEntries 
  } = useQuery<JournalEntry[]>({
    queryKey: ['/api/journal', userId],
    enabled: !!userId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { 
    data: analytics = null, 
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery<JournalAnalytics>({
    queryKey: ['/api/journal/analytics', userId],
    enabled: !!userId && activeView === 'analytics',
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Enhanced filtering with tags support
  const filteredEntries = entries.filter((entry: JournalEntry) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      entry.title?.toLowerCase().includes(searchLower) ||
      entry.content.toLowerCase().includes(searchLower) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(searchLower));
    
    const matchesMood = moodFilter === 'all' || entry.mood === moodFilter;
    
    return matchesSearch && matchesMood;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + entriesPerPage);

  // Event handlers
  const handleNewEntry = useCallback(() => {
    setSelectedEntry(null);
    setActiveView('editor');
  }, []);

  const handleEditEntry = useCallback((entry: JournalEntry) => {
    setSelectedEntry(entry);
    setActiveView('editor');
  }, []);

  const handleViewEntry = useCallback((entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowEntryModal(true);
  }, []);

  const handleSaveEntry = useCallback(() => {
    setActiveView('list');
    setSelectedEntry(null);
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/journal', userId] });
    queryClient.invalidateQueries({ queryKey: ['/api/journal/analytics', userId] });
  }, [queryClient, userId]);

  const handleCancelEdit = useCallback(() => {
    setActiveView('list');
    setSelectedEntry(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowEntryModal(false);
    setSelectedEntry(null);
  }, []);

  // Mood utility functions (single implementation)
  const getMoodEmoji = useCallback((mood: string): string => {
    const moodEmojis: Record<string, string> = {
      'very_happy': '😄',
      'happy': '😊',
      'neutral': '😐',
      'sad': '😢',
      'very_sad': '😭',
      'angry': '😠',
      'anxious': '😰',
      'excited': '🤩',
      'calm': '😌',
      'frustrated': '😤'
    };
    return moodEmojis[mood] || '😐';
  }, []);

  const getMoodColor = useCallback((mood: string): string => {
    const moodColors: Record<string, string> = {
      'very_happy': '#10B981',
      'happy': '#34D399',
      'neutral': '#6B7280',
      'sad': '#F59E0B',
      'very_sad': '#EF4444',
      'angry': '#DC2626',
      'anxious': '#F97316',
      'excited': '#8B5CF6',
      'calm': '#06B6D4',
      'frustrated': '#EC4899'
    };
    return moodColors[mood] || '#6B7280';
  }, []);

  // Entry Card Component
  const renderEntryCard = useCallback((entry: JournalEntry) => {
    const wordCount = entry.content.split(/\s+/).filter(word => word.length > 0).length;
    
    return (
      <div
        key={`entry-${entry.id}`}
        className="theme-card rounded-lg p-4 border border-[var(--theme-accent)]/30 hover:border-[var(--theme-accent)]/50 transition-all hover-lift"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold theme-text mb-1">
              {entry.title || 'Untitled Entry'}
            </h3>
            <div className="flex items-center gap-3 text-xs theme-text-secondary">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {entry.createdAt ? format(new Date(entry.createdAt), 'MMM dd, yyyy') : 'Unknown date'}
              </span>
              <span>{wordCount} words</span>
              {entry.mood && (
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: getMoodColor(entry.mood) + '20',
                    color: getMoodColor(entry.mood)
                  }}
                >
                  {getMoodEmoji(entry.mood)} {entry.mood.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewEntry(entry)}
              className="p-1 rounded theme-text-secondary hover:theme-text transition-colors"
              title="View entry"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => handleEditEntry(entry)}
              className="p-1 rounded theme-text-secondary hover:theme-text transition-colors"
              title="Edit entry"
            >
              <Edit3 size={16} />
            </button>
          </div>
        </div>
        
        <p className="text-sm theme-text-secondary leading-relaxed mb-3">
          {entry.content.substring(0, 150)}
          {entry.content.length > 150 && '...'}
        </p>

        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.tags.slice(0, 3).map((tag: string) => (
              <span
                key={`tag-${entry.id}-${tag}`}
                className="px-2 py-1 text-xs rounded-full theme-surface theme-text-secondary border border-[var(--theme-accent)]/20"
              >
                #{tag}
              </span>
            ))}
            {entry.tags.length > 3 && (
              <span className="px-2 py-1 text-xs rounded-full theme-surface theme-text-secondary">
                +{entry.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    );
  }, [getMoodColor, getMoodEmoji, handleViewEntry, handleEditEntry]);

  // Analytics View
  const renderAnalytics = () => {
    if (analyticsLoading) {
      return <LoadingSpinner message="Analyzing your journal data..." />;
    }

    if (analyticsError) {
      return (
        <ErrorMessage 
          error="Failed to load analytics data" 
          onRetry={refetchAnalytics}
        />
      );
    }

    if (!analytics) {
      return (
        <EmptyState
          icon={<BarChart3 className="theme-text-secondary" size={48} />}
          title="No analytics available"
          description="Write a few journal entries to see your analytics"
          action={
            <button
              onClick={handleNewEntry}
              className="px-6 py-2 bg-[var(--theme-accent)] text-white rounded-lg hover:shadow-lg transition-all"
            >
              Write Your First Entry
            </button>
          }
        />
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold theme-text">Total Entries</h3>
              <BookOpen className="theme-text-secondary" size={20} />
            </div>
            <p className="text-2xl font-bold theme-text">{analytics.totalEntries || 0}</p>
            <p className="text-sm theme-text-secondary mt-1">
              {analytics.writingStreak || 0} day writing streak
            </p>
          </div>

          <div className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold theme-text">Avg. Words</h3>
              <MessageCircle className="theme-text-secondary" size={20} />
            </div>
            <p className="text-2xl font-bold theme-text">{Math.round(analytics.averageWordsPerEntry || 0)}</p>
            <p className="text-sm theme-text-secondary mt-1">per entry</p>
          </div>

          <div className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold theme-text">Mood Intensity</h3>
              <Star className="theme-text-secondary" size={20} />
            </div>
            <p className="text-2xl font-bold theme-text">{Math.round((analytics.averageMoodIntensity || 0) * 10)}%</p>
            <p className="text-sm theme-text-secondary mt-1">average intensity</p>
          </div>
        </div>

        {analytics.themes && analytics.themes.length > 0 && (
          <div className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
            <h3 className="font-semibold theme-text mb-4">Common Themes</h3>
            <div className="space-y-3">
              {analytics.themes.slice(0, 5).map((theme, index) => (
                <div key={`theme-${index}`} className="flex items-center justify-between">
                  <span className="theme-text">{theme.theme}</span>
                  <span className="text-sm theme-text-secondary">{theme.count} entries</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Main Render Logic
  if (activeView === 'editor') {
    return (
      <div className="h-full">
        <JournalEditor
          userId={userId}
          entry={selectedEntry || undefined}
          onSave={handleSaveEntry}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

  if (activeView === 'analytics') {
    return (
      <div className="h-full p-6 overflow-y-auto theme-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold theme-text">Journal Analytics</h2>
            <button
              onClick={() => setActiveView('list')}
              className="px-4 py-2 theme-surface border border-[var(--theme-accent)]/30 rounded-lg hover:border-[var(--theme-accent)]/50 transition-all theme-text"
            >
              Back to Entries
            </button>
          </div>
          {renderAnalytics()}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col theme-background">
      {/* Header */}
      <div className="p-6 border-b border-[var(--theme-accent)]/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold theme-text">My Journal</h2>
          <button
            onClick={handleNewEntry}
            className="flex items-center space-x-2 px-4 py-2 bg-[var(--theme-accent)] text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            <span>New Entry</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 theme-text-secondary" size={20} />
            <input
              type="text"
              placeholder="Search entries and tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 theme-surface border border-[var(--theme-accent)]/30 rounded-lg focus:border-[var(--theme-accent)] theme-text"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={moodFilter}
              onChange={(e) => setMoodFilter(e.target.value)}
              className="px-3 py-2 theme-surface border border-[var(--theme-accent)]/30 rounded-lg focus:border-[var(--theme-accent)] theme-text"
            >
              <option value="all">All Moods</option>
              <option value="very_happy">Very Happy</option>
              <option value="happy">Happy</option>
              <option value="neutral">Neutral</option>
              <option value="sad">Sad</option>
              <option value="very_sad">Very Sad</option>
              <option value="anxious">Anxious</option>
              <option value="excited">Excited</option>
              <option value="calm">Calm</option>
            </select>
            <button
              onClick={() => setActiveView('analytics')}
              className="flex items-center space-x-2 px-4 py-2 theme-surface border border-[var(--theme-accent)]/30 rounded-lg hover:border-[var(--theme-accent)]/50 transition-all theme-text"
            >
              <TrendingUp size={20} />
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {entriesLoading ? (
          <LoadingSpinner message="Loading your journal entries..." />
        ) : entriesError ? (
          <ErrorMessage 
            error="Failed to load journal entries" 
            onRetry={refetchEntries}
          />
        ) : filteredEntries.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="theme-text-secondary" size={48} />}
            title={searchQuery || moodFilter !== 'all' ? "No matching entries" : "No journal entries yet"}
            description={searchQuery || moodFilter !== 'all' ? "Try adjusting your search or filters" : "Start your journaling journey with your first entry"}
            action={
              <button
                onClick={handleNewEntry}
                className="px-6 py-2 bg-[var(--theme-accent)] text-white rounded-lg hover:shadow-lg transition-all"
              >
                Write Your First Entry
              </button>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 mb-6">
              {paginatedEntries.map(renderEntryCard)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm theme-text-secondary">
                  Showing {startIndex + 1}-{Math.min(startIndex + entriesPerPage, filteredEntries.length)} of {filteredEntries.length} entries
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 theme-surface border border-[var(--theme-accent)]/30 rounded disabled:opacity-50 disabled:cursor-not-allowed theme-text"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 theme-text">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 theme-surface border border-[var(--theme-accent)]/30 rounded disabled:opacity-50 disabled:cursor-not-allowed theme-text"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Entry View Modal */}
      {showEntryModal && selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="theme-card rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold theme-text mb-2">
                    {selectedEntry.title || 'Untitled Entry'}
                  </h3>
                  <div className="flex items-center gap-3 text-sm theme-text-secondary">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {selectedEntry.createdAt ? format(new Date(selectedEntry.createdAt), 'MMMM dd, yyyy • h:mm a') : 'Unknown date'}
                    </span>
                    {selectedEntry.mood && (
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: getMoodColor(selectedEntry.mood) + '20',
                          color: getMoodColor(selectedEntry.mood)
                        }}
                      >
                        {getMoodEmoji(selectedEntry.mood)} {selectedEntry.mood.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded theme-text-secondary hover:theme-text transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="prose max-w-none theme-text">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {selectedEntry.content}
                </p>
              </div>

              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[var(--theme-accent)]/20">
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.tags.map((tag: string) => (
                      <span
                        key={`modal-tag-${selectedEntry.id}-${tag}`}
                        className="px-3 py-1 text-sm rounded-full theme-surface theme-text-secondary border border-[var(--theme-accent)]/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 theme-surface border border-[var(--theme-accent)]/30 rounded-lg hover:border-[var(--theme-accent)]/50 transition-all theme-text"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleCloseModal();
                    handleEditEntry(selectedEntry);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-[var(--theme-accent)] text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Edit3 size={16} />
                  <span>Edit Entry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}