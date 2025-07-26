import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Save, Plus, Calendar, Tag, Heart, Smile, Meh, Frown, AlertCircle, Send, Brain, BarChart3, Download, FileText } from 'lucide-react';

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

interface JournalAnalytics {
  emotionalJourney: Array<{ date: string; sentiment: number; mood: string }>;
  recurringThemes: Array<{ theme: string; frequency: number }>;
  sentimentTrend: number;
  riskIndicators: string[];
  therapeuticProgress: string;
}

interface TherapeuticJournalProps {
  userId: number | null;
  onEntryCreated?: (entry: JournalEntry) => void;
}

const TherapeuticJournal: React.FC<TherapeuticJournalProps> = ({ userId, onEntryCreated }) => {
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
  const [isFreshStart, setIsFreshStart] = useState(false);
  const [activeTab, setActiveTab] = useState('write');
  const [analytics, setAnalytics] = useState<JournalAnalytics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const moodOptions = [
    { value: 'very_happy', label: 'Very Happy', icon: '😊', color: 'bg-green-100 text-green-800' },
    { value: 'happy', label: 'Happy', icon: '🙂', color: 'bg-green-50 text-green-700' },
    { value: 'neutral', label: 'Neutral', icon: '😐', color: 'bg-gray-100 text-gray-700' },
    { value: 'sad', label: 'Sad', icon: '🙁', color: 'bg-blue-100 text-blue-700' },
    { value: 'very_sad', label: 'Very Sad', icon: '😢', color: 'bg-blue-200 text-blue-800' },
    { value: 'anxious', label: 'Anxious', icon: '😰', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'angry', label: 'Angry', icon: '😠', color: 'bg-red-100 text-red-800' },
    { value: 'grateful', label: 'Grateful', icon: '🙏', color: 'bg-purple-100 text-purple-800' }
  ];

  const commonTags = [
    'therapy', 'gratitude', 'anxiety', 'depression', 'progress', 'goals', 
    'relationships', 'work', 'family', 'mindfulness', 'breakthrough', 'challenge'
  ];

  useEffect(() => {
    // Always fetch recent entries on component mount
    fetchRecentEntries();
  }, []);

  const fetchRecentEntries = async () => {
    console.log('fetchRecentEntries called with userId:', userId);
    
    try {
      // Use the same user session approach as the chat system
      const deviceFingerprint = localStorage.getItem('deviceFingerprint') || 
                               `device_${Math.random().toString(36).substring(2, 15)}`;
      const sessionId = localStorage.getItem('sessionId') || 
                       `session_${Math.random().toString(36).substring(2, 15)}`;
      
      // Store for future use
      localStorage.setItem('deviceFingerprint', deviceFingerprint);
      localStorage.setItem('sessionId', sessionId);
      
      // Fetch entries using device fingerprint to get correct user
      const url = `/api/journal/user-entries`;
      console.log('Fetching from URL:', url);
      const response = await fetch(url, {
        headers: {
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-ID': sessionId
        }
      });
      console.log('Response status:', response.status, response.ok);
      
      if (response.ok) {
        const entries = await response.json();
        console.log('Fetched entries:', entries);
        setRecentEntries(entries.slice(0, 5)); // Show 5 most recent
        
        // If we have entries, override fresh start status
        if (entries.length > 0) {
          console.log('Found entries, removing freshStart flag');
          localStorage.removeItem('freshStart');
        }
      } else {
        console.error('Response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch recent entries:', error);
      setRecentEntries([]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Auto-stop after 2 minutes
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 120000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        const transcription = data.text || '';
        
        setEntry(prev => ({
          ...prev,
          content: prev.content + (prev.content ? ' ' : '') + transcription
        }));
        
        // Auto-resize textarea
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
      } else {
        console.error('Transcription failed:', response.statusText);
        alert('Voice transcription is temporarily unavailable. Please try typing instead.');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Voice transcription failed. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !entry.tags.includes(tag)) {
      setEntry(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setEntry(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const saveEntry = async () => {
    if (!entry.content.trim()) {
      alert('Please write something before saving your journal entry.');
      return;
    }

    setIsSaving(true);
    try {
      // Get device fingerprint for user session consistency
      const deviceFingerprint = localStorage.getItem('deviceFingerprint') || 
                               `device_${Math.random().toString(36).substring(2, 15)}`;
      const sessionId = localStorage.getItem('sessionId') || 
                       `session_${Math.random().toString(36).substring(2, 15)}`;
      
      localStorage.setItem('deviceFingerprint', deviceFingerprint);
      localStorage.setItem('sessionId', sessionId);
      
      const response = await fetch('/api/journal/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          title: entry.title || `Entry - ${new Date().toLocaleDateString()}`,
          content: entry.content,
          mood: entry.mood,
          moodIntensity: entry.moodIntensity,
          tags: entry.tags,
          isPrivate: entry.isPrivate
        })
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
        
        // Refresh recent entries
        fetchRecentEntries();
        
        // Trigger AI analysis for the saved entry
        analyzeEntry(savedEntry);
        
        if (onEntryCreated) {
          onEntryCreated(savedEntry);
        }
      } else {
        throw new Error('Failed to save entry');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save your journal entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const analyzeEntry = async (savedEntry: JournalEntry) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/journal/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: savedEntry.userId,
          entryId: savedEntry.id,
          content: savedEntry.content,
          mood: savedEntry.mood,
          moodIntensity: savedEntry.moodIntensity
        })
      });

      if (response.ok) {
        const analysis = await response.json();
        setAiInsights(analysis.insights || 'Analysis completed successfully');
        
        // Check for crisis indicators
        if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
          alert(`Important: I've detected you may be going through a difficult time. Please consider reaching out for support. Crisis Hotline: 988`);
        }
      }
    } catch (error) {
      console.error('Error analyzing entry:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Use the same device fingerprint approach as other journal functions
      const deviceFingerprint = localStorage.getItem('deviceFingerprint') || 
                               `device_${Math.random().toString(36).substring(2, 15)}`;
      const sessionId = localStorage.getItem('sessionId') || 
                       `session_${Math.random().toString(36).substring(2, 15)}`;
      
      localStorage.setItem('deviceFingerprint', deviceFingerprint);
      localStorage.setItem('sessionId', sessionId);
      
      const response = await fetch('/api/journal/analytics', {
        headers: {
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-ID': sessionId
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Convert the real analytics data to match the expected structure
        const convertedAnalytics = {
          emotionalJourney: data.moodTrends?.map((trend: any, index: number) => ({
            date: trend.date,
            sentiment: (trend.intensity - 5) / 5, // Convert 1-10 scale to -1 to 1
            mood: trend.mood
          })) || [],
          recurringThemes: Object.entries(data.themes || {}).map(([theme, frequency]) => ({
            theme,
            frequency: frequency as number
          })),
          sentimentTrend: data.averageMoodIntensity || 0,
          riskIndicators: [],
          therapeuticProgress: `Based on ${data.totalEntries} journal entries, you're showing positive engagement with self-reflection. Your average mood intensity is ${data.averageMoodIntensity?.toFixed(1)}. Continue your journaling practice for continued emotional growth.`
        };
        setAnalytics(convertedAnalytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const exportTherapistReport = async () => {
    try {
      const deviceFingerprint = localStorage.getItem('deviceFingerprint') || 
                               `device_${Math.random().toString(36).substring(2, 15)}`;
      const sessionId = localStorage.getItem('sessionId') || 
                       `session_${Math.random().toString(36).substring(2, 15)}`;
      
      localStorage.setItem('deviceFingerprint', deviceFingerprint);
      localStorage.setItem('sessionId', sessionId);
      
      const response = await fetch('/api/journal/export/therapist', {
        headers: {
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-ID': sessionId
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `therapist-report-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting therapist report:', error);
      alert('Failed to export therapist report. Please try again.');
    }
  };

  const exportPersonalInsights = async () => {
    try {
      const deviceFingerprint = localStorage.getItem('deviceFingerprint') || 
                               `device_${Math.random().toString(36).substring(2, 15)}`;
      const sessionId = localStorage.getItem('sessionId') || 
                       `session_${Math.random().toString(36).substring(2, 15)}`;
      
      localStorage.setItem('deviceFingerprint', deviceFingerprint);
      localStorage.setItem('sessionId', sessionId);
      
      const response = await fetch('/api/journal/export/insights', {
        headers: {
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-ID': sessionId
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `personal-insights-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting personal insights:', error);
      alert('Failed to export personal insights. Please try again.');
    }
  };

  useEffect(() => {
    fetchRecentEntries();
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [userId, activeTab]);

  const selectedMood = moodOptions.find(mood => mood.value === entry.mood) || moodOptions[2];

  return (
    <div className="h-full flex flex-col theme-background p-4">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <Heart className="w-5 h-5 mr-2" />
          Journal entry saved successfully!
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Header with Navigation Tabs */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Therapeutic Journal</h2>
          <p className="text-white/70">Express your thoughts and feelings in a safe, private space</p>
          
          {/* Navigation Tabs */}
          <div className="therapeutic-journal-tabs flex gap-2 mt-4">
            {[
              { id: 'write', label: 'Write Entry', icon: FileText },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'insights', label: 'AI Insights', icon: Brain },
              { id: 'export', label: 'Export Reports', icon: Download }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shimmer-border flex-1 flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-lg transition-all duration-200 text-white font-medium text-xs ${
                  activeTab === tab.id
                    ? 'shadow-lg border-2 border-silver animate-shimmer'
                    : 'hover:shadow-md border border-silver hover:border-2 hover:animate-shimmer'
                }`}
                style={{
                  background: activeTab === tab.id 
                    ? 'linear-gradient(to right, var(--theme-primary), var(--theme-accent))'
                    : 'linear-gradient(to right, var(--theme-primary-light), var(--theme-surface))',
                  minHeight: '60px',
                  maxHeight: '60px'
                }}
              >
                <tab.icon 
                  className="w-5 h-5 flex-shrink-0" 
                  style={{ 
                    background: 'none',
                    backgroundColor: 'transparent',
                    color: 'white',
                    fill: 'white'
                  }}
                />
                <span 
                  className="font-medium text-center leading-tight"
                  style={{ 
                    background: 'none',
                    backgroundColor: 'transparent',
                    color: 'white'
                  }}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'write' && (
          <>
          {/* Recent Entries Section */}
          {recentEntries.length > 0 && (
            <div className="theme-card/30 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Recent Journal Entries
              </h3>
              <div className="space-y-3">
                {recentEntries.map((recentEntry) => (
                  <div 
                    key={recentEntry.id} 
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedEntry(recentEntry);
                      setViewMode('view');
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-white truncate">
                        {recentEntry.title || `Entry from ${new Date(recentEntry.createdAt || '').toLocaleDateString()}`}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        moodOptions.find(m => m.value === recentEntry.mood)?.color || 'bg-gray-100 text-gray-700'
                      }`}>
                        {moodOptions.find(m => m.value === recentEntry.mood)?.icon || '😐'} {moodOptions.find(m => m.value === recentEntry.mood)?.label || 'Neutral'}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm line-clamp-2">
                      {recentEntry.content.substring(0, 120)}...
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-1">
                        {recentEntry.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="bg-blue-500/30 text-blue-100 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-white/60 text-xs">
                        {new Date(recentEntry.createdAt || '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entry Viewer Modal */}
          {selectedEntry && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2 text-gray-800">
                        {selectedEntry.title || 'Untitled Entry'}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{new Date(selectedEntry.createdAt || '').toLocaleDateString()}</span>
                        {selectedEntry.mood && (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            moodOptions.find(m => m.value === selectedEntry.mood)?.color || 'bg-gray-100 text-gray-700'
                          }`}>
                            {moodOptions.find(m => m.value === selectedEntry.mood)?.icon} {moodOptions.find(m => m.value === selectedEntry.mood)?.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEntry(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Content */}
                  <div className="prose max-w-none mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-800 leading-relaxed">
                      {selectedEntry.content}
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.tags.map(tag => (
                          <span key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Analysis */}
                  {selectedEntry.aiAnalysis && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">AI Therapeutic Analysis</h4>
                      <p className="text-blue-700 text-sm">{selectedEntry.aiAnalysis.insights}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Write New Entry Form */}
          <div className="theme-card/30 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
          {/* Title Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Give your entry a title (optional)"
              value={entry.title}
              onChange={(e) => setEntry(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#000000]/30 focus:border-blue-400 focus:outline-none text-lg font-medium text-gray-800 placeholder-gray-500"
              style={{ 
                backgroundColor: '#ffffff',
                color: '#1a202c'
              }}
            />
          </div>

          {/* Content Area with Voice Recording */}
          <div className="mb-6">
            <div className="relative">
              <textarea
                ref={textareaRef}
                placeholder="What's on your mind today? Share your thoughts, feelings, experiences, or anything that feels important to you..."
                value={entry.content}
                onChange={(e) => {
                  setEntry(prev => ({ ...prev, content: e.target.value }));
                  // Auto-resize
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="w-full min-h-[200px] px-4 py-3 pr-16 rounded-xl border-2 border-[#000000]/30 focus:border-blue-400 focus:outline-none resize-none text-base leading-relaxed text-gray-800 placeholder-gray-500"
                style={{ 
                  maxHeight: '400px',
                  backgroundColor: '#ffffff',
                  color: '#1a202c'
                }}
              />
              
              {/* Voice Recording Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
                className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg transition-all ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                    : isTranscribing
                    ? 'bg-yellow-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isTranscribing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {isRecording && (
              <p className="text-red-600 text-sm mt-2 flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                Recording... Speak naturally and take your time
              </p>
            )}
            
            {isTranscribing && (
              <p className="text-yellow-600 text-sm mt-2">
                Converting your voice to text...
              </p>
            )}
          </div>

          {/* Mood Selection */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-3">How are you feeling?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setEntry(prev => ({ ...prev, mood: mood.value }))}
                  className={`p-3 rounded-xl border-2 transition-all text-center relative ${
                    entry.mood === mood.value
                      ? 'border-theme-accent theme-primary shadow-lg ring-2 ring-theme-accent/50 scale-105'
                      : 'border-theme-accent/50 theme-surface hover:border-theme-accent hover:theme-primary-light'
                  }`}
                >
                  {entry.mood === mood.value && (
                    <div className="absolute top-1 right-1 w-3 h-3 theme-primary rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}
                  <div className="text-2xl mb-1">{mood.icon}</div>
                  <div className="text-xs font-medium text-white">{mood.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mood Intensity */}
          <div className="mb-6 theme-primary/100 rounded-xl p-4">
            <label className="block text-white font-medium mb-3">
              Intensity: {entry.moodIntensity}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={entry.moodIntensity}
              onChange={(e) => setEntry(prev => ({ ...prev, moodIntensity: parseInt(e.target.value) }))}
              className="w-full h-2 theme-primary/100 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-white/70 mt-1">
              <span>Mild</span>
              <span>Moderate</span>
              <span>Intense</span>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6 theme-primary/100 rounded-xl p-4">
            <label className="block text-white font-medium mb-3">Tags (help categorize your thoughts)</label>
            
            {/* Current Tags */}
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="theme-primary text-white px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-white/80 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Common Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {commonTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  disabled={entry.tags.includes(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    entry.tags.includes(tag)
                      ? 'theme-primary/100 text-white/50 cursor-not-allowed'
                      : 'theme-primary text-white hover:theme-primary'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag(newTag)}
                className="flex-1 px-3 py-2 rounded-lg border border-[#3949ab]/50 focus:border-[#000000] focus:outline-none text-sm text-gray-800 placeholder-gray-500"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#1a202c'
                }}
              />
              <button
                onClick={() => addTag(newTag)}
                className="px-4 py-2 theme-primary text-white rounded-lg hover:theme-primary transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={entry.isPrivate}
                onChange={(e) => setEntry(prev => ({ ...prev, isPrivate: e.target.checked }))}
                className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-white">Keep this entry private</span>
            </label>
          </div>

          {/* Save Button */}
          <button
            onClick={saveEntry}
            disabled={isSaving || !entry.content.trim()}
            className={`w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center ${
              isSaving || !entry.content.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Journal Entry
              </>
            )}
          </button>
        </div>
        </>
        )}

        {/* Recent Entries (shown only on write tab) */}
        {activeTab === 'write' && recentEntries.length > 0 && (
          <div className="theme-card/20 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Recent Entries
            </h3>
            <div className="space-y-3">
              {recentEntries.map((recentEntry, index) => (
                <div 
                  key={recentEntry.id || index} 
                  className="theme-primary/30 rounded-lg p-4 border border-[#000000]/30 cursor-pointer hover:bg-opacity-40 transition-all"
                  onClick={() => {
                    setSelectedEntry(recentEntry);
                    setViewMode('view');
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-white">
                      {recentEntry.title || `Entry ${index + 1}`}
                    </h4>
                    <span className="text-xs text-white/60">
                      {new Date(recentEntry.createdAt || '').toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm line-clamp-2">
                    {recentEntry.content.substring(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full ${
                        moodOptions.find(m => m.value === recentEntry.mood)?.color || 'theme-primary text-white'
                      }`}>
                        {moodOptions.find(m => m.value === recentEntry.mood)?.label || 'Unknown'}
                      </span>
                      {recentEntry.tags.length > 0 && (
                        <span className="ml-2 text-white/60">
                          +{recentEntry.tags.length} tags
                        </span>
                      )}
                    </div>
                    <span className="text-white/50 text-xs">
                      Click to view
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="theme-card/30 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Journal Analytics
            </h3>
            
            {analytics ? (
              <div className="space-y-6">
                {/* Emotional Journey Chart */}
                <div className="theme-primary/30 rounded-xl p-4">
                  <h4 className="font-medium text-white mb-3">Emotional Journey (Last 30 Days)</h4>
                  <div className="h-40 bg-gradient-to-r from-[#000000]/40 to-[#000000]/40 rounded-lg flex items-end justify-around p-4">
                    {Array.isArray(analytics.emotionalJourney) ? analytics.emotionalJourney.slice(0, 7).map((day, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="w-6 theme-primary rounded-t mb-2"
                          style={{ height: `${Math.max(10, (day.sentiment + 1) * 50)}px` }}
                        />
                        <span className="text-xs text-white/70">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    )) : (
                      <div className="w-full text-center text-white/60">
                        No emotional journey data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Recurring Themes */}
                <div className="theme-primary/30 rounded-xl p-4">
                  <h4 className="font-medium text-white mb-3">Recurring Themes</h4>
                  <div className="space-y-2">
                    {Array.isArray(analytics.recurringThemes) && analytics.recurringThemes.length > 0 ? (
                      analytics.recurringThemes.map((theme, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-white/90">{theme.theme}</span>
                          <div className="flex items-center">
                            <div className="w-20 bg-[var(--theme-secondary)] rounded-full h-2 mr-2">
                              <div 
                                className="theme-primary h-2 rounded-full"
                                style={{ width: `${(theme.frequency / 20) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-white/70">{theme.frequency}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="w-full text-center text-white/60">
                        No recurring themes data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Therapeutic Progress */}
                <div className="theme-primary/30 rounded-xl p-4">
                  <h4 className="font-medium text-white mb-2">Therapeutic Progress</h4>
                  <p className="text-white/90 text-sm leading-relaxed">
                    {analytics.therapeuticProgress}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <button
                  onClick={fetchAnalytics}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  Generate Analytics
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div className="theme-card/30 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              AI Insights
            </h3>
            
            {isAnalyzing && (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-[#000000] border-t-transparent rounded-full animate-spin mr-3" />
                <span className="text-white/70">Analyzing your entries...</span>
              </div>
            )}
            
            {aiInsights && !isAnalyzing && (
              <div className="theme-primary/30 rounded-xl p-6">
                <h4 className="font-medium text-white mb-3">Latest Analysis</h4>
                <div className="prose prose-sm text-white/90">
                  {aiInsights.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
            
            {!aiInsights && !isAnalyzing && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/70 mb-4">
                    Recent AI insights will appear here
                  </p>
                  <p className="text-sm text-white/50">
                    Save a journal entry to generate new AI therapeutic insights
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Sample AI Analysis</h4>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="mb-3">
                      <span className="text-sm text-white/60">Analysis from recent entry:</span>
                    </div>
                    <p className="text-white/90 mb-4">
                      "This entry reflects a positive and optimistic outlook. The individual experienced success and productivity at work, which has contributed to a strong sense of accomplishment and gratitude."
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded text-sm">success</span>
                      <span className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded text-sm">optimism</span>
                      <span className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded text-sm">gratitude</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-green-300">Risk Level: Low</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Reports Tab */}
        {activeTab === 'export' && (
          <div className="theme-card/30 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Export Reports
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Therapist Report */}
              <div className="theme-primary/30 rounded-xl p-6">
                <h4 className="font-medium text-white mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Therapist Report
                </h4>
                <p className="text-sm text-white/70 mb-4">
                  Professional clinical summary with mood patterns, risk assessment, and therapeutic recommendations
                </p>
                <button
                  onClick={exportTherapistReport}
                  className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Therapist Report
                </button>
              </div>

              {/* Personal Insights */}
              <div className="theme-primary/30 rounded-xl p-6">
                <h4 className="font-medium text-white mb-2 flex items-center">
                  <Heart className="w-4 h-4 mr-2" />
                  Personal Insights
                </h4>
                <p className="text-sm text-white/70 mb-4">
                  Personal wellness report focusing on growth, patterns, and positive reinforcement
                </p>
                <button
                  onClick={exportPersonalInsights}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Personal Report
                </button>
              </div>
            </div>

            {/* Export Information */}
            <div className="mt-6 theme-primary/30 border border-[#000000]/50 rounded-xl p-4">
              <h5 className="font-medium text-white mb-2">About Your Reports</h5>
              <ul className="text-sm text-white/80 space-y-1">
                <li>• Reports are generated using AI analysis of your journal entries and mood data</li>
                <li>• Therapist reports include clinical insights suitable for healthcare providers</li>
                <li>• Personal reports focus on your growth journey and positive patterns</li>
                <li>• All reports respect your privacy settings and only include data you've chosen to share</li>
              </ul>
            </div>
          </div>
        )}

        {/* Journal Entry Viewer Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">
                      {selectedEntry.title || 'Untitled Entry'}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{new Date(selectedEntry.createdAt || '').toLocaleDateString()}</span>
                      {selectedEntry.mood && (
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            moodOptions.find(m => m.value === selectedEntry.mood)?.color || 'bg-gray-100 text-gray-700'
                          }`}>
                            {moodOptions.find(m => m.value === selectedEntry.mood)?.icon} {moodOptions.find(m => m.value === selectedEntry.mood)?.label}
                          </span>
                        </div>
                      )}
                      {selectedEntry.moodIntensity && (
                        <span className="text-xs text-gray-500">
                          Intensity: {selectedEntry.moodIntensity}/10
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewMode === 'view' && (
                      <button
                        onClick={() => {
                          // Load the entry data into the form
                          setEntry({
                            title: selectedEntry.title || '',
                            content: selectedEntry.content,
                            mood: selectedEntry.mood,
                            moodIntensity: selectedEntry.moodIntensity || 5,
                            tags: selectedEntry.tags || [],
                            isPrivate: selectedEntry.isPrivate
                          });
                          // Close the modal
                          setSelectedEntry(null);
                          // Switch to write tab so user can see and edit the content
                          setActiveTab('write');
                          // Scroll to the top of the form after a brief delay
                          setTimeout(() => {
                            const writeTab = document.querySelector('[data-tab="write"]');
                            if (writeTab) {
                              writeTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Edit Entry
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedEntry(null)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="prose prose-gray max-w-none">
                      {selectedEntry.content.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-3 text-gray-700 leading-relaxed">
                          {paragraph || '\u00A0'}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Privacy Status */}
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedEntry.isPrivate 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedEntry.isPrivate ? '🔒 Private' : '🌐 Shared'}
                    </span>
                  </div>
                </div>

                {/* AI Analysis if available */}
                {selectedEntry.aiAnalysis && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">AI Analysis</h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-gray-700">
                        {selectedEntry.aiAnalysis.insights}
                      </div>
                      {selectedEntry.aiAnalysis.themes && selectedEntry.aiAnalysis.themes.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium text-gray-800 mb-2">Themes:</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedEntry.aiAnalysis.themes.map((theme, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-sm">
                                {theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapeuticJournal;