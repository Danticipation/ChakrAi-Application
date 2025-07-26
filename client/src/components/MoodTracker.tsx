import { getCurrentUserId } from "../utils/userSession";
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Brain, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';

interface MoodEntry {
  id: number;
  emotion: string;
  intensity: number;
  valence: number;
  arousal: number;
  context: string;
  riskLevel: string;
  timestamp: string;
}

interface EmotionalState {
  primaryEmotion: string;
  intensity: number;
  valence: number;
  arousal: number;
  confidence: number;
  supportiveResponse?: string;
  recommendedActions?: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const EMOTIONS = [
  { name: 'joy', icon: '😊', color: '#FFD700' },
  { name: 'calm', icon: '😌', color: '#87CEEB' },
  { name: 'excited', icon: '🤩', color: '#FF6347' },
  { name: 'grateful', icon: '🙏', color: '#98FB98' },
  { name: 'anxious', icon: '😰', color: '#FFA500' },
  { name: 'sad', icon: '😢', color: '#6495ED' },
  { name: 'frustrated', icon: '😤', color: '#FF4500' },
  { name: 'neutral', icon: '😐', color: '#D3D3D3' }
];

export default function MoodTracker({ userId = getCurrentUserId()}: { userId?: number }) {
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [intensity, setIntensity] = useState(50);
  const [context, setContext] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Check for fresh start and disable data fetching if true
  const isFreshStart = localStorage.getItem('freshStart') === 'true';

  // Fetch recent mood entries
  const { data: moodData } = useQuery({
    queryKey: ['/api/mood-entries', userId],
    queryFn: async () => {
      const response = await fetch(`/api/mood-entries?userId=${userId}&limit=7`);
      if (!response.ok) throw new Error('Failed to fetch mood entries');
      return response.json();
    },
    staleTime: 60000,
    enabled: !isFreshStart // Don't fetch if fresh start
  });

  // Fetch emotional patterns
  const { data: patterns } = useQuery({
    queryKey: ['/api/emotional-patterns', userId],
    queryFn: async () => {
      const response = await fetch(`/api/emotional-patterns?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch emotional patterns');
      return response.json();
    },
    staleTime: 300000, // 5 minutes
    enabled: !isFreshStart // Don't fetch if fresh start
  });

  // Log mood entry mutation
  const logMood = useMutation({
    mutationFn: async (moodData: any) => {
      const deviceFingerprint = localStorage.getItem('deviceFingerprint') || 
                               `device_${Math.random().toString(36).substring(2, 15)}`;
      const sessionId = localStorage.getItem('sessionId') || 
                       `session_${Math.random().toString(36).substring(2, 15)}`;
      
      localStorage.setItem('deviceFingerprint', deviceFingerprint);
      localStorage.setItem('sessionId', sessionId);
      
      const response = await fetch('/api/mood/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          emotion: selectedEmotion,
          intensity,
          context,
          timestamp: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error('Failed to log mood');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mood-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/emotional-patterns'] });
      setSelectedEmotion('');
      setIntensity(50);
      setContext('');
      // Show success message
      console.log('Mood logged successfully!');
    }
  });

  const handleSubmitMood = () => {
    if (!selectedEmotion) return;
    logMood.mutate({
      emotion: selectedEmotion,
      intensity,
      context
    });
  };

  const getEmotionIcon = (emotion: string) => {
    const found = EMOTIONS.find(e => e.name === emotion);
    return found ? found.icon : '😐';
  };

  const getEmotionColor = (emotion: string) => {
    const found = EMOTIONS.find(e => e.name === emotion);
    return found ? found.color : '#D3D3D3';
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity < 30) return '#98FB98';
    if (intensity < 70) return '#FFD700';
    return '#FF6347';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Mood Tracking
        </h2>
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="px-3 py-1 rounded-lg text-sm font-medium flex items-center"
          style={{ 
            backgroundColor: 'var(--soft-blue-light)',
            color: 'var(--soft-blue-dark)'
          }}
        >
          <TrendingUp className="w-4 h-4 mr-1" />
          {showAnalytics ? 'Hide' : 'Show'} Analytics
        </button>
      </div>

      {/* Quick Mood Logger */}
      <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: 'var(--pale-green)' }}>
        <div className="flex items-center mb-3">
          <Heart className="w-5 h-5 mr-2" style={{ color: 'var(--soft-blue-dark)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            How are you feeling right now?
          </h3>
        </div>

        {/* Emotion Selection */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {EMOTIONS.map((emotion) => (
            <button
              key={emotion.name}
              onClick={() => setSelectedEmotion(emotion.name)}
              className={`p-3 rounded-xl text-center transition-all ${
                selectedEmotion === emotion.name ? 'ring-2 ring-blue-500 scale-105' : ''
              }`}
              style={{ 
                backgroundColor: selectedEmotion === emotion.name ? emotion.color + '40' : 'white',
                border: `2px solid ${selectedEmotion === emotion.name ? emotion.color : 'transparent'}`
              }}
            >
              <div className="text-2xl mb-1">{emotion.icon}</div>
              <div className="text-xs font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                {emotion.name}
              </div>
            </button>
          ))}
        </div>

        {/* Always show intensity and context inputs */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Intensity: {intensity}/100
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={intensity}
            onChange={(e) => setIntensity(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ 
              background: `linear-gradient(to right, ${getIntensityColor(intensity)} 0%, ${getIntensityColor(intensity)} ${intensity}%, #e5e7eb ${intensity}%, #e5e7eb 100%)`
            }}
          />
        </div>

        {/* Context Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            What's happening? (optional)
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Describe what's happening or what you're thinking about..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            style={{ backgroundColor: 'white' }}
            rows={3}
          />
        </div>

        {/* Submit Button - Always visible but disabled without emotion */}
        <button
          onClick={handleSubmitMood}
          disabled={!selectedEmotion || logMood.isPending}
          className="w-full px-4 py-3 rounded-xl font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: 'var(--soft-blue-dark)',
            color: 'white'
          }}
        >
          {logMood.isPending ? 'Saving...' : !selectedEmotion ? 'Select an emotion to save' : 'Save Mood Entry'}
        </button>
      </div>

      {/* Recent Mood Entries */}
      <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: 'var(--gentle-lavender)' }}>
        <div className="flex items-center mb-3">
          <Calendar className="w-5 h-5 mr-2" style={{ color: 'var(--soft-blue-dark)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recent Moods
          </h3>
        </div>

        {moodData?.entries?.length > 0 ? (
          <div className="space-y-2">
            {moodData.entries.slice(0, 5).map((entry: MoodEntry) => (
              <div key={entry.id} className="bg-white/60 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getEmotionIcon(entry.emotion)}</span>
                  <div>
                    <div className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                      {entry.emotion}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {entry.intensity}%
                  </div>
                  {entry.riskLevel !== 'low' && (
                    <div title={`Risk level: ${entry.riskLevel}`}>
                      <AlertTriangle className="w-4 h-4 text-orange-500 ml-auto" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Start tracking your mood to see patterns over time</p>
          </div>
        )}
      </div>

      {/* Emotional Patterns Analytics */}
      {showAnalytics && patterns && (
        <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: 'var(--soft-blue-light)' }}>
          <div className="flex items-center mb-3">
            <Brain className="w-5 h-5 mr-2" style={{ color: 'var(--soft-blue-dark)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Emotional Insights
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dominant Emotions */}
            <div className="bg-white/60 rounded-xl p-3">
              <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Most Common Emotions
              </h4>
              <div className="space-y-1">
                {patterns.dominantEmotions?.slice(0, 3).map((emotion: string, index: number) => (
                  <div key={emotion} className="flex items-center">
                    <span className="mr-2">{getEmotionIcon(emotion)}</span>
                    <span className="capitalize text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {emotion}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emotional Trend */}
            <div className="bg-white/60 rounded-xl p-3">
              <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Emotional Trend
              </h4>
              <div className="flex items-center">
                <TrendingUp 
                  className={`w-5 h-5 mr-2 ${
                    patterns.trendDirection === 'improving' ? 'text-green-500' :
                    patterns.trendDirection === 'declining' ? 'text-red-500' : 'text-gray-500'
                  }`} 
                />
                <span className="capitalize text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {patterns.trendDirection}
                </span>
              </div>
            </div>

            {/* Coping Strategies */}
            {patterns.copingStrategies?.length > 0 && (
              <div className="bg-white/60 rounded-xl p-3 md:col-span-2">
                <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Recommended Coping Strategies
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                  {patterns.copingStrategies.slice(0, 4).map((strategy: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{strategy}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}