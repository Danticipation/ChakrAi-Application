import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Save, Trash2, Eye, EyeOff, Brain, TrendingUp, FileText, Mic, Square, AlertCircle } from 'lucide-react';
import type { JournalEntry, JournalAnalytics } from '@shared/schema';

interface JournalEditorProps {
  entry?: JournalEntry;
  onSave?: (entry: JournalEntry) => void;
  onCancel?: () => void;
  userId: number;
}

interface EmotionalTag {
  id: string;
  label: string;
  color: string;
}

const emotionalTags: EmotionalTag[] = [
  { id: 'happy', label: 'Happy', color: '#10B981' },
  { id: 'sad', label: 'Sad', color: '#3B82F6' },
  { id: 'anxious', label: 'Anxious', color: '#F59E0B' },
  { id: 'grateful', label: 'Grateful', color: '#8B5CF6' },
  { id: 'frustrated', label: 'Frustrated', color: '#EF4444' },
  { id: 'hopeful', label: 'Hopeful', color: '#06B6D4' },
  { id: 'overwhelmed', label: 'Overwhelmed', color: '#EC4899' },
  { id: 'peaceful', label: 'Peaceful', color: '#84CC16' }
];

const moodOptions = [
  { value: 'very_positive', label: '😊 Very Positive', color: '#10B981' },
  { value: 'positive', label: '🙂 Positive', color: '#84CC16' },
  { value: 'neutral', label: '😐 Neutral', color: '#6B7280' },
  { value: 'negative', label: '🙁 Negative', color: '#F59E0B' },
  { value: 'very_negative', label: '😢 Very Negative', color: '#EF4444' }
];

export default function JournalEditor({ entry, onSave, onCancel, userId }: JournalEditorProps) {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState(entry?.mood || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(entry?.emotionalTags || []);
  const [triggers, setTriggers] = useState<string[]>(entry?.triggers || []);
  const [gratitude, setGratitude] = useState<string[]>(entry?.gratitude || []);
  const [goals, setGoals] = useState<string[]>(entry?.goals || []);
  const [newTrigger, setNewTrigger] = useState('');
  const [newGratitude, setNewGratitude] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analytics, setAnalytics] = useState<JournalAnalytics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const queryClient = useQueryClient();

  // Voice recording functions with mimeType in scope
  const [currentMimeType, setCurrentMimeType] = useState<string>('');

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try MP4 first for better OpenAI Whisper compatibility
      let mimeType = 'audio/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/wav';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          throw new Error('Browser does not support MP4 or WAV recording. WebM causes transcription failures.');
        }
      }
      
      setCurrentMimeType(mimeType);
      console.log('🎵 JournalEditor using audio format:', mimeType);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: currentMimeType });
        console.log('🎵 JournalEditor audio blob type:', audioBlob.type);
        await sendAudioToWhisper(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToWhisper = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      const fileName = audioBlob.type.includes('wav') ? 'recording.wav' : 
                      audioBlob.type.includes('mp4') ? 'recording.mp4' : 'recording.audio';
      formData.append('audio', audioBlob, fileName);

      const response = await axios.post('/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.text) {
        // Append transcription to existing content with a space if content exists
        const newContent = content ? content + ' ' + response.data.text : response.data.text;
        setContent(newContent);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      
      // Show user-friendly error message based on error type
      let errorMessage = 'Voice transcription failed. Please try again or use text input.';
      
      // Check if it's an axios error with response
      if (error?.response?.data) {
        if (error.response.data.errorType === 'quota_exceeded') {
          errorMessage = 'Voice transcription temporarily unavailable due to high demand. Please try again later or type your entry manually.';
        } else if (error.response.data.errorType === 'auth_error') {
          errorMessage = 'Voice transcription service configuration error. Please use text input for now.';
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error?.response?.status === 503) {
        errorMessage = 'Voice transcription service is temporarily unavailable. Please try again later or type your entry manually.';
      } else if (error?.response?.status === 429) {
        errorMessage = 'Voice transcription temporarily unavailable due to high demand. Please try again later or type your entry manually.';
      }
      
      // Show user-friendly error notification
      setErrorMessage(errorMessage);
      setTimeout(() => setErrorMessage(null), 5000); // Auto-dismiss after 5 seconds
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (journalData: any) => {
      // Healthcare-grade authentication headers
      const headers = {
        'X-Device-Fingerprint': 'healthcare-user-107',
        'X-Session-ID': 'healthcare-session-107'
      };
      
      if (entry?.id) {
        const response = await axios.patch(`/api/journal/${entry.id}`, journalData, { headers });
        return response.data;
      } else {
        const response = await axios.post('/api/journal', journalData, { headers });
        return response.data;
      }
    },
    onSuccess: async (savedEntry) => {
      console.log("Journal entry saved successfully");
      
      // Track journal activity for goal tracking
      try {
        await axios.post('/api/users/activity', {
          userId: userId,
          activityType: 'journal_entry',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to track journal activity:', error);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      onSave?.(savedEntry);
    },
    onError: (error) => {
      console.error("Failed to save journal entry:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!entry?.id) return;
      
      // Healthcare-grade authentication headers
      const headers = {
        'X-Device-Fingerprint': 'healthcare-user-107',
        'X-Session-ID': 'healthcare-session-107'
      };
      
      await axios.delete(`/api/journal/${entry.id}`, { headers });
    },
    onSuccess: () => {
      console.log("Journal entry deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      onCancel?.();
    },
    onError: (error) => {
      console.error("Failed to delete journal entry:", error);
    },
  });

  const analyzeEntryMutation = useMutation({
    mutationFn: async () => {
      if (!entry?.id) return null;
      const response = await axios.get(`/api/journal/${entry.id}/analyze`);
      return response.data;
    },
    onSuccess: (analysisData) => {
      setAnalytics(analysisData);
      setShowAnalysis(true);
    },
    onError: (error) => {
      console.error("Failed to analyze journal entry:", error);
    },
  });

  const handleSave = () => {
    if (!content.trim()) {
      console.warn("Content required before saving");
      return;
    }

    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200);

    const journalData = {
      userId,
      title: title.trim() || undefined,
      content: content.trim(),
      mood: mood || undefined,
      emotionalTags: selectedTags.length > 0 ? selectedTags : undefined,
      triggers: triggers.length > 0 ? triggers : undefined,
      gratitude: gratitude.length > 0 ? gratitude : undefined,
      goals: goals.length > 0 ? goals : undefined,
      wordCount,
      readingTime
    };

    saveMutation.mutate(journalData);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const addTrigger = () => {
    if (newTrigger.trim() && !triggers.includes(newTrigger.trim())) {
      setTriggers([...triggers, newTrigger.trim()]);
      setNewTrigger('');
    }
  };

  const addGratitude = () => {
    if (newGratitude.trim() && !gratitude.includes(newGratitude.trim())) {
      setGratitude([...gratitude, newGratitude.trim()]);
      setNewGratitude('');
    }
  };

  const addGoal = () => {
    if (newGoal.trim() && !goals.includes(newGoal.trim())) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const removeTrigger = (index: number) => {
    setTriggers(triggers.filter((_, i) => i !== index));
  };

  const removeGratitude = (index: number) => {
    setGratitude(gratitude.filter((_, i) => i !== index));
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (entry?.id) {
      setIsAnalyzing(true);
      analyzeEntryMutation.mutate();
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {entry ? 'Edit Entry' : 'New Journal Entry'}
          </h2>
          {entry && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ 
                backgroundColor: 'var(--soft-blue-dark)',
                color: 'white'
              }}
            >
              <Brain className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
            </button>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="rounded-lg p-4 bg-red-50 border border-red-200 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 text-sm font-medium">Voice Transcription Error</p>
              <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Title Input */}
        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: 'var(--surface-secondary)' }}>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your entry a title..."
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ 
              borderColor: 'var(--gentle-lavender-dark)',
              backgroundColor: 'white',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Mood Selection */}
        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: 'var(--gentle-lavender)' }}>
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
            How are you feeling?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {moodOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setMood(option.value)}
                className={`p-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  mood === option.value ? 'border-opacity-100' : 'border-transparent'
                }`}
                style={{ 
                  backgroundColor: mood === option.value ? option.color + '20' : 'white',
                  borderColor: mood === option.value ? option.color : 'transparent',
                  color: 'var(--text-primary)'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Editor */}
        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: 'var(--surface-secondary)' }}>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Your Thoughts
          </label>
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what's on your mind... Express your thoughts, feelings, experiences, or reflections freely."
              className="w-full h-32 px-3 py-2 pr-12 rounded-lg border text-sm resize-none"
              style={{ 
                borderColor: 'var(--gentle-lavender-dark)',
                backgroundColor: 'white',
                color: 'var(--text-primary)'
              }}
            />
            {/* Voice Input Button */}
            <button
              onClick={toggleRecording}
              disabled={isTranscribing}
              className={`absolute right-2 top-2 p-2 rounded-full transition-all ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Start voice recording'}
            >
              {isTranscribing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRecording ? (
                <Square className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="flex justify-between items-center mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>{content.split(/\s+/).filter(word => word.length > 0).length} words</span>
            <div className="flex items-center gap-2">
              {isTranscribing && <span className="text-blue-500">Transcribing...</span>}
              {isRecording && <span className="text-red-500">Recording...</span>}
              <span>~{Math.ceil(content.split(/\s+/).filter(word => word.length > 0).length / 200)} min read</span>
            </div>
          </div>
        </div>

        {/* Emotional Tags */}
        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: 'var(--pale-green)' }}>
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
            Emotional Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {emotionalTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleTagToggle(tag.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedTags.includes(tag.id) ? 'text-white' : 'text-gray-700'
                }`}
                style={{ 
                  backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'white',
                  border: `1px solid ${tag.color}`
                }}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Analysis Display */}
        {showAnalysis && analytics && (
          <div className="rounded-2xl p-4 shadow-sm border-2" style={{ 
            backgroundColor: 'var(--surface-secondary)',
            borderColor: 'var(--soft-blue-dark)'
          }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Brain className="w-5 h-5" />
                AI Insights
              </h3>
              <button
                onClick={() => setShowAnalysis(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <EyeOff className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Sentiment & Intensity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--gentle-lavender)' }}>
                  <div className="text-lg font-bold" style={{ color: 'var(--soft-blue-dark)' }}>
                    {((analytics.sentimentScore || 0) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sentiment</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--pale-green)' }}>
                  <div className="text-lg font-bold" style={{ color: 'var(--soft-blue-dark)' }}>
                    {analytics.emotionalIntensity || 0}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Intensity</div>
                </div>
              </div>

              {/* Key Insights */}
              {analytics.keyInsights && analytics.keyInsights.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Key Insights</h4>
                  <ul className="space-y-1">
                    {analytics.keyInsights.slice(0, 3).map((insight, index) => (
                      <li key={index} className="text-xs flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Actions */}
              {analytics.recommendedActions && analytics.recommendedActions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Suggestions</h4>
                  <ul className="space-y-1">
                    {analytics.recommendedActions.slice(0, 2).map((action, index) => (
                      <li key={index} className="text-xs flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t flex gap-3" style={{ borderColor: 'var(--gentle-lavender-dark)' }}>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending || !content.trim()}
          className="flex-1 px-4 py-3 rounded-2xl text-sm font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ 
            backgroundColor: 'var(--soft-blue-dark)',
            color: 'white'
          }}
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving...' : 'Save Entry'}
        </button>
        
        {entry && (
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="px-4 py-3 rounded-2xl text-sm font-medium shadow-sm flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: '#EF4444',
              color: 'white'
            }}
          >
            <Trash2 className="w-4 h-4" />
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        )}
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-3 rounded-2xl text-sm font-medium shadow-sm"
            style={{ 
              backgroundColor: 'var(--surface-secondary)',
              color: 'var(--text-primary)'
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}