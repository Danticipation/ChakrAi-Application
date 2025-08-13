import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Save, Plus, Calendar, Tag, Heart, Smile, Meh, Frown, 
  AlertCircle, Send, Brain, BarChart3, Download, FileText, Trash2, 
  Edit3, BookOpen, TrendingUp, Eye, EyeOff, Clock, User, Sparkles,
  PenTool, Library, Star, Filter, Search, MoreHorizontal
} from 'lucide-react';

interface JournalEntry {
  id?: number;
  title: string;
  content: string;
  mood: string;
  moodIntensity: number;
  tags: string[];
  isPrivate: boolean;
  createdAt?: string;
  aiAnalysis?: {
    sentiment: number;
    emotionalPatterns: string[];
    themes: string[];
    riskLevel: string;
    insights: string;
  };
}

interface EnhancedJournalInterfaceProps {
  userId: number | null;
  onEntryCreated?: (entry: JournalEntry) => void;
}

const EnhancedJournalInterface: React.FC<EnhancedJournalInterfaceProps> = ({ userId, onEntryCreated }) => {
  const [activeTab, setActiveTab] = useState('write');
  const [entry, setEntry] = useState<JournalEntry>({
    title: '',
    content: '',
    mood: 'neutral',
    moodIntensity: 5,
    tags: [],
    isPrivate: true
  });
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('all');
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const moodOptions = [
    { value: 'very_happy', label: 'Joyful', icon: '✨', color: '#10B981', bgColor: 'bg-emerald-50' },
    { value: 'happy', label: 'Happy', icon: '😊', color: '#059669', bgColor: 'bg-emerald-100' },
    { value: 'grateful', label: 'Grateful', icon: '🙏', color: '#7C3AED', bgColor: 'bg-purple-50' },
    { value: 'calm', label: 'Calm', icon: '🧘', color: '#0EA5E9', bgColor: 'bg-sky-50' },
    { value: 'neutral', label: 'Neutral', icon: '😐', color: '#6B7280', bgColor: 'bg-gray-50' },
    { value: 'thoughtful', label: 'Reflective', icon: '🤔', color: '#8B5CF6', bgColor: 'bg-violet-50' },
    { value: 'anxious', label: 'Anxious', icon: '😰', color: '#F59E0B', bgColor: 'bg-amber-50' },
    { value: 'sad', label: 'Sad', icon: '😢', color: '#3B82F6', bgColor: 'bg-blue-50' },
    { value: 'frustrated', label: 'Frustrated', icon: '😤', color: '#EF4444', bgColor: 'bg-red-50' },
    { value: 'overwhelmed', label: 'Overwhelmed', icon: '😵', color: '#DC2626', bgColor: 'bg-red-100' }
  ];

  const commonTags = [
    { name: 'Breakthrough', color: '#10B981', icon: '🌟' },
    { name: 'Progress', color: '#059669', icon: '📈' },
    { name: 'Challenge', color: '#F59E0B', icon: '💪' },
    { name: 'Relationships', color: '#EC4899', icon: '💝' },
    { name: 'Work', color: '#6366F1', icon: '💼' },
    { name: 'Family', color: '#8B5CF6', icon: '👨‍👩‍👧‍👦' },
    { name: 'Self-Care', color: '#06B6D4', icon: '🌸' },
    { name: 'Goals', color: '#84CC16', icon: '🎯' },
    { name: 'Mindfulness', color: '#A855F7', icon: '🧘‍♀️' },
    { name: 'Therapy', color: '#F97316', icon: '🗣️' },
    { name: 'Gratitude', color: '#EAB308', icon: '🙏' },
    { name: 'Anxiety', color: '#EF4444', icon: '⚡' }
  ];

  useEffect(() => {
    fetchRecentEntries();
  }, []);

  const fetchRecentEntries = async () => {
    try {
      const deviceFingerprint = 'healthcare-user-107';
      const sessionId = 'healthcare-session-107';
      
      const response = await fetch('/api/journal/user-entries', {
        headers: {
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-ID': sessionId
        }
      });
      
      if (response.ok) {
        const entries = await response.json();
        setRecentEntries(entries);
      }
    } catch (error) {
      console.error('Failed to fetch recent entries:', error);
      setRecentEntries([]);
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moodOption = moodOptions.find(option => option.value === mood);
    return moodOption?.icon || '😐';
  };

  const getMoodColor = (mood: string) => {
    const moodOption = moodOptions.find(option => option.value === mood);
    return moodOption?.color || '#6B7280';
  };

  const handleSave = async () => {
    if (!entry.content.trim()) return;
    
    setIsSaving(true);
    try {
      const deviceFingerprint = 'healthcare-user-107';
      const sessionId = 'healthcare-session-107';
      
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(entry)
      });

      if (response.ok) {
        const savedEntry = await response.json();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        // Reset form
        setEntry({
          title: '',
          content: '',
          mood: 'neutral',
          moodIntensity: 5,
          tags: [],
          isPrivate: true
        });
        
        // Refresh entries
        fetchRecentEntries();
        onEntryCreated?.(savedEntry);
        
        // Switch to entries tab to show the saved entry
        setActiveTab('entries');
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId: number | undefined) => {
    if (!entryId) return;
    
    setDeletingEntryId(entryId);
    try {
      const deviceFingerprint = 'healthcare-user-107';
      const sessionId = 'healthcare-session-107';
      
      const response = await fetch(`/api/journal/${entryId}`, {
        method: 'DELETE',
        headers: {
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-ID': sessionId
        }
      });

      if (response.ok) {
        // Remove from local state
        setRecentEntries(prev => prev.filter(entry => entry.id !== entryId));
        // Close modal if this entry was open
        if (selectedEntry?.id === entryId) {
          setSelectedEntry(null);
        }
      } else {
        alert('Failed to delete entry. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('Failed to delete entry. Please try again.');
    } finally {
      setDeletingEntryId(null);
    }
  };

  const filteredEntries = recentEntries.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood = moodFilter === 'all' || entry.mood === moodFilter;
    return matchesSearch && matchesMood;
  });

  const renderWriteTab = () => (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-emerald-100 rounded-full p-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-emerald-800 font-medium">Entry saved successfully!</p>
            <p className="text-emerald-600 text-sm">Your thoughts have been safely recorded.</p>
          </div>
        </div>
      )}

      {/* Title Input */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-100">
          <label className="block text-slate-700 font-semibold text-sm">
            <Edit3 className="w-4 h-4 inline mr-2" />
            Title (Optional)
          </label>
        </div>
        <div className="p-6">
          <input
            type="text"
            value={entry.title}
            onChange={(e) => setEntry(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Give your thoughts a meaningful title..."
            className="w-full text-lg placeholder-slate-400 border-0 focus:ring-0 focus:outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Mood Selection */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-4 border-b border-slate-100">
          <label className="block text-slate-700 font-semibold text-sm">
            <Heart className="w-4 h-4 inline mr-2" />
            How are you feeling today?
          </label>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {moodOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setEntry(prev => ({ ...prev, mood: option.value }))}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${
                  entry.mood === option.value 
                    ? 'border-current shadow-lg transform scale-105' 
                    : 'border-slate-200 hover:border-slate-300'
                } ${option.bgColor}`}
                style={{ 
                  borderColor: entry.mood === option.value ? option.color : undefined,
                  boxShadow: entry.mood === option.value ? `0 8px 25px ${option.color}20` : undefined
                }}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="text-sm font-medium text-slate-700">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <label className="block text-slate-700 font-semibold text-sm">
            <PenTool className="w-4 h-4 inline mr-2" />
            Your Thoughts & Reflections
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {/* Voice recording logic */}}
              className={`p-2 rounded-xl transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-100 text-red-600 animate-pulse' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="p-6">
          <textarea
            ref={textareaRef}
            value={entry.content}
            onChange={(e) => setEntry(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Share what's on your mind... your thoughts, feelings, experiences, or anything you'd like to reflect on."
            className="w-full h-64 text-slate-700 placeholder-slate-400 border-0 focus:ring-0 focus:outline-none bg-transparent resize-none text-base leading-relaxed"
          />
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>{entry.content.length} characters</span>
            <span>{entry.content.split(/\s+/).filter(word => word.length > 0).length} words</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-100">
          <label className="block text-slate-700 font-semibold text-sm">
            <Tag className="w-4 h-4 inline mr-2" />
            Tags & Categories
          </label>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {commonTags.map(tag => (
              <button
                key={tag.name}
                onClick={() => {
                  setEntry(prev => ({
                    ...prev,
                    tags: prev.tags.includes(tag.name)
                      ? prev.tags.filter(t => t !== tag.name)
                      : [...prev.tags, tag.name]
                  }));
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  entry.tags.includes(tag.name)
                    ? 'text-white shadow-lg transform scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={{
                  backgroundColor: entry.tags.includes(tag.name) ? tag.color : undefined
                }}
              >
                <span>{tag.icon}</span>
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center pb-8">
        <button
          onClick={handleSave}
          disabled={isSaving || !entry.content.trim()}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 hover:scale-105"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Entry
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderEntriesTab = () => (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Search and Filter */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your entries..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={moodFilter}
            onChange={(e) => setMoodFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Moods</option>
            {moodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Entries Grid */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-slate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No entries yet</h3>
          <p className="text-slate-500 mb-6">Start your therapeutic journey by writing your first entry.</p>
          <button
            onClick={() => setActiveTab('write')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
          >
            Write First Entry
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredEntries.map((journalEntry, index) => (
            <div
              key={journalEntry.id}
              className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer group"
              onClick={() => setSelectedEntry(journalEntry)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${getMoodColor(journalEntry.mood)}15` }}
                    >
                      {getMoodEmoji(journalEntry.mood)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {journalEntry.title || 'Untitled Entry'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        {new Date(journalEntry.createdAt || '').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
                        handleDeleteEntry(journalEntry.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-xl transition-all text-red-600 hover:text-red-700"
                    title="Delete entry"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-slate-600 line-clamp-3 mb-4">
                  {journalEntry.content}
                </p>
                
                {journalEntry.tags && journalEntry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {journalEntry.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                    {journalEntry.tags.length > 3 && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                        +{journalEntry.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Therapeutic Journal
        </h1>
        <p className="text-slate-600 text-lg">
          Express your thoughts and feelings in a safe, private space
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-8 overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('write')}
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'write'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <PenTool className="w-5 h-5" />
            Write Entry
          </button>
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'entries'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Library className="w-5 h-5" />
            My Entries ({recentEntries.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'write' && renderWriteTab()}
      {activeTab === 'entries' && renderEntriesTab()}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${getMoodColor(selectedEntry.mood)}15` }}
                  >
                    {getMoodEmoji(selectedEntry.mood)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      {selectedEntry.title || 'Untitled Entry'}
                    </h2>
                    <p className="text-slate-500">
                      {new Date(selectedEntry.createdAt || '').toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
                        handleDeleteEntry(selectedEntry.id);
                      }
                    }}
                    disabled={deletingEntryId === selectedEntry.id}
                    className="p-2 hover:bg-red-50 rounded-xl transition-colors text-red-600 hover:text-red-700 disabled:opacity-50"
                    title="Delete entry"
                  >
                    {deletingEntryId === selectedEntry.id ? (
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="prose prose-slate max-w-none mb-6">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedEntry.content}
                </p>
              </div>
              
              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedJournalInterface;