import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Brain, TrendingUp, User, RotateCcw, Volume2, Play, Pause, Settings, Sparkles, Heart, Target, BookOpen, AlertTriangle } from 'lucide-react';
import { getAuthHeaders } from '../utils/unifiedUserSession';

interface PersonalityReflectionData {
  // New comprehensive format
  comprehensiveAnalysis?: {
    bigFive?: any;
    attachmentStyle?: any;
    cognitivePatterns?: any;
    emotionalIntelligence?: any;
    defenseMechanisms?: any;
    communicationStyle?: any;
    coreValues?: any;
    shadowWork?: any;
    relationalPatterns?: any;
    existentialThemes?: any;
  };
  executiveSummary?: string;
  strengthsDeepDive?: string[];
  growthEdges?: string[];
  wellnessRecommendations?: string[];
  closingReflection?: string;
  
  // Legacy simple format (fallback)
  communicationStyle?: string;
  emotionalPatterns?: string[];
  strengths?: string[];
  growthOpportunities?: string[];
  personalityInsights?: {
    dominantTraits?: string[];
    communicationPreference?: string;
    emotionalProcessing?: string;
  };
  
  dataPoints: {
    journalEntries: number;
    conversationMessages: number;
    moodDataPoints: number;
  };
  analysisStatus?: string;
  lastUpdated?: string;
}

interface PersonalityReflectionProps {
  userId?: number;
}

const PersonalityReflection: React.FC<PersonalityReflectionProps> = ({ userId }) => {
  // Use unified user session system
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const currentUserId = userId || 0;
  
  // ElevenLabs Text-to-Speech state
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('Rachel'); // Default ElevenLabs voice
  const [elevenLabsVoices] = useState([
    { id: 'Rachel', name: 'Rachel - Calm & Professional' },
    { id: 'Bella', name: 'Bella - Warm & Caring' },
    { id: 'Josh', name: 'Josh - Confident & Clear' },
    { id: 'Arnold', name: 'Arnold - Deep & Reassuring' }
  ]);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['personality-reflection', currentUserId, refreshTrigger],
    queryFn: async (): Promise<PersonalityReflectionData> => {
      console.log('ðŸ§  PersonalityReflection: Fetching for authenticated user:', currentUserId);
      
      // Use unified authentication headers (includes X-User-ID)
      const authHeaders = await getAuthHeaders();
      console.log('ðŸ” PersonalityReflection: Using auth headers:', authHeaders);
      
      const response = await fetch(`/api/personality-insights`, {
        headers: {
          ...authHeaders
          // Note: UID is handled by the HIPAA auth system automatically
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('âŒ PersonalityReflection: Fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch personality reflection: ${response.status}`);
      }
      return response.json() as Promise<PersonalityReflectionData>;
    },
    enabled: currentUserId > 0, // Only run query when we have a valid user ID
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    void refetch();
  };

  // ElevenLabs Text-to-Speech functions
  const speakAnalysis = async () => {
    if (!data) return;
    
    if (isPlaying) {
      stopSpeaking();
      return;
    }

    try {
      setIsPlaying(true);

      // Build text from available data (comprehensive or legacy format)
      const textParts = [
        'Here is your comprehensive personality analysis.',
        data.executiveSummary ? `Executive Summary: ${data.executiveSummary}` : '',
        data.comprehensiveAnalysis?.communicationStyle?.overview ? `Communication Style: ${data.comprehensiveAnalysis.communicationStyle.overview}` : 
          data.communicationStyle ? `Communication Style: ${data.communicationStyle}` : '',
        (data.strengthsDeepDive || data.strengths) ? `Your Strengths: ${(data.strengthsDeepDive || data.strengths || []).join('. ')}` : '',
        (data.growthEdges || data.growthOpportunities) ? `Growth Opportunities: ${(data.growthEdges || data.growthOpportunities || []).join('. ')}` : '',
        data.wellnessRecommendations ? `Wellness Recommendations: ${data.wellnessRecommendations.join('. ')}` : '',
        'This completes your personality analysis. Remember, this analysis is based on your unique journey and data.'
      ];

      const fullText = textParts.filter(Boolean).join('\n\n').trim();

      const headers = await getAuthHeaders();
      console.log('🎤 Calling TTS API with headers:', headers);
      console.log('🎤 TTS Request:', { voice: selectedVoice, textLength: fullText.length });
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: fullText,
          voice: selectedVoice,
          stability: 0.5,
          similarity_boost: 0.75
        }),
      });

      console.log('🎤 TTS Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ TTS API Error:', response.status, errorText);
        throw new Error(`Failed to generate speech: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      setAudioElement(audio);

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        console.error('Audio playback error');
      };

      void audio.play();

    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsPlaying(false);
      // Fallback to browser TTS if ElevenLabs fails
      fallbackToNativeTTS();
    }
  };

  const stopSpeaking = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.src = '';
      setAudioElement(null);
    }
    
    // Also stop native speech synthesis if it's running
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    setIsPlaying(false);
  };

  // Fallback to native browser TTS
  const fallbackToNativeTTS = () => {
    if (!data) return;

    const textParts = [
      'Here is your comprehensive personality analysis.',
      data.executiveSummary ? `Executive Summary: ${data.executiveSummary}` : '',
      data.comprehensiveAnalysis?.communicationStyle?.overview ? `Communication Style: ${data.comprehensiveAnalysis.communicationStyle.overview}` : 
        data.communicationStyle ? `Communication Style: ${data.communicationStyle}` : '',
      (data.strengthsDeepDive || data.strengths) ? `Your Strengths: ${(data.strengthsDeepDive || data.strengths || []).join('. ')}` : '',
      (data.growthEdges || data.growthOpportunities) ? `Growth Opportunities: ${(data.growthEdges || data.growthOpportunities || []).join('. ')}` : '',
      'This completes your personality analysis.'
    ];

    const fullText = textParts.filter(Boolean).join('\n\n').trim();

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechSynthesis.speak(utterance);
  };

  if (isLoading || currentUserId === 0) {
    return (
      <div className="p-6 h-full theme-primary">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-[#9fa8da]" />
            Personality Reflection
          </h2>
        </div>
        <div className="theme-primary/30 backdrop-blur-sm rounded-xl p-6 border border-[#9fa8da]/50">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/30 rounded w-3/4"></div>
            <div className="h-4 bg-white/30 rounded w-1/2"></div>
            <div className="h-4 bg-white/30 rounded w-5/6"></div>
            <div className="h-4 bg-white/30 rounded w-2/3"></div>
          </div>
          <div className="text-center mt-4 text-white/60">
            {currentUserId === 0 ? 'Authenticating...' : 'Loading personality analysis...'}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 h-full theme-primary">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-[#9fa8da]" />
            Personality Reflection
          </h2>
          <button
            onClick={handleRefresh}
            className="p-2 theme-primary text-white rounded-lg hover:theme-primary transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-6">
          <p className="text-red-200">Unable to generate your personality reflection. Please try refreshing or continue engaging with the platform to build more data for analysis.</p>
        </div>
      </div>
    );
  }

  const formatReflectionText = (text: string) => {
    // Safety check for undefined/null text
    if (!text || typeof text !== 'string') {
      return (
        <div className="space-y-4 text-white leading-relaxed">
          <p className="text-white/90 leading-relaxed">No analysis text available.</p>
        </div>
      );
    }
    
    // If no structured format, just display as paragraphs
    if (!text.includes('1.') && !text.includes('TRAIT')) {
      return (
        <div className="space-y-4 text-white leading-relaxed">
          {text.split('\n').filter(line => line.trim()).map((paragraph, index) => (
            <p key={index} className="text-white/90 leading-relaxed">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      );
    }

    // Split by numbered sections and format nicely
    const sections = text.split(/(?=\d+\.\s+[A-Z\s]+:)/);
    
    return sections.map((section, index) => {
      if (!section.trim()) return null;
      
      const lines = section.trim().split('\n');
      const title = lines[0] || '';
      const content = lines.slice(1).join(' ').trim(); // Join with spaces, not newlines
      
      // Check if this is a numbered section
      const isNumberedSection = /^\d+\.\s+[A-Z\s]+:/.test(title || '');
      
      if (isNumberedSection) {
        const cleanTitle = title.replace(/^\d+\.\s+/, '').replace(':', '').trim();
        return (
          <div key={index} className="mb-6">
            <h3 className="font-semibold text-[#9fa8da] mb-3 flex items-center gap-2">
              {cleanTitle.includes('TRAIT') && <User className="w-4 h-4" />}
              {cleanTitle.includes('POSITIVE') && <TrendingUp className="w-4 h-4" />}
              {cleanTitle.includes('GROWTH') && <RotateCcw className="w-4 h-4" />}
              {cleanTitle.includes('EMOTIONAL') && <Brain className="w-4 h-4" />}
              <span>{cleanTitle}</span>
            </h3>
            <p className="text-white/90 leading-relaxed">{content}</p>
          </div>
        );
      } else {
        return (
          <p key={index} className="text-white/90 leading-relaxed mb-4">
            {section.trim()}
          </p>
        );
      }
    }).filter(Boolean);
  };

  return (
    <div className="p-6 h-full bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#3949ab] overflow-y-auto">
      {/* Enhanced Header with Text-to-Speech Controls */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-3 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                Personality Reflection
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </h2>
              <p className="text-white/70">Comprehensive AI-powered psychological insights</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Text-to-Speech Controls */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-2 flex items-center gap-2">
              <button
                onClick={speakAnalysis}
                disabled={!data}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isPlaying 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-500 disabled:cursor-not-allowed'
                }`}
                title={isPlaying ? 'Stop Reading' : 'Read Analysis Aloud'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Listen
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                title="Voice Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={handleRefresh}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center gap-2"
              title="Refresh Analysis"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice Settings Panel */}
        {showVoiceSettings && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 mt-4 border border-white/20">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Voice Selection
            </h3>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {elevenLabsVoices.map((voice) => (
                <option key={voice.id} value={voice.id} className="bg-gray-800 text-white">
                  {voice.name}
                </option>
              ))}
            </select>
            <p className="text-white/60 text-sm mt-2">
              Choose a voice that feels comfortable for your therapeutic experience
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Data Points Summary */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-300" />
          <h3 className="text-lg font-semibold text-white">Analysis Foundation</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white mb-1">{data?.dataPoints.conversationMessages || 0}</div>
            <div className="text-white/70 text-sm">Therapeutic Conversations</div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div className="bg-blue-400 h-2 rounded-full" style={{width: `${Math.min((data?.dataPoints.conversationMessages || 0) * 10, 100)}%`}}></div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white mb-1">{data?.dataPoints.journalEntries || 0}</div>
            <div className="text-white/70 text-sm">Journal Reflections</div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div className="bg-green-400 h-2 rounded-full" style={{width: `${Math.min((data?.dataPoints.journalEntries || 0) * 20, 100)}%`}}></div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white mb-1">{data?.dataPoints.moodDataPoints || 0}</div>
            <div className="text-white/70 text-sm">Mood Entries</div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div className="bg-purple-400 h-2 rounded-full" style={{width: `${Math.min((data?.dataPoints.moodDataPoints || 0) * 15, 100)}%`}}></div>
            </div>
          </div>
        </div>
        <div className="text-center mt-4 text-white/60 text-sm">
          Last updated: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Generating...'}
        </div>
      </div>

      {/* Enhanced AI Personality Analysis */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-blue-400 to-purple-400 p-2 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">Comprehensive AI Analysis</h3>
        </div>
        
        {data ? (
          <div className="space-y-8">
            {/* Executive Summary (if comprehensive analysis) */}
            {data.executiveSummary && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Executive Summary
                </h4>
                {formatReflectionText(data.executiveSummary)}
              </div>
            )}

            {/* Communication Style */}
            {(data.comprehensiveAnalysis?.communicationStyle?.overview || data.communicationStyle) && (
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Communication Style
                </h4>
                {formatReflectionText(data.comprehensiveAnalysis?.communicationStyle?.overview || data.communicationStyle || '')}
              </div>
            )}

            {/* Strengths */}
            {(data.strengthsDeepDive || data.strengths) && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Your Strengths
                </h4>
                {formatReflectionText((data.strengthsDeepDive || data.strengths || []).join('\n\n'))}
              </div>
            )}

            {/* Growth Opportunities */}
            {(data.growthEdges || data.growthOpportunities) && (
              <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl p-6 border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  Growth Opportunities
                </h4>
                {formatReflectionText((data.growthEdges || data.growthOpportunities || []).join('\n\n'))}
              </div>
            )}

            {/* Wellness Recommendations */}
            {data.wellnessRecommendations && data.wellnessRecommendations.length > 0 && (
              <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-xl p-6 border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-400" />
                  Wellness Recommendations
                </h4>
                {formatReflectionText(data.wellnessRecommendations.join('\n\n'))}
              </div>
            )}

            {/* Big Five Personality Assessment */}
            {data.comprehensiveAnalysis?.bigFive && (
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-6 border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  Big Five Personality Assessment
                </h4>
                <div className="space-y-4">
                  {Object.entries(data.comprehensiveAnalysis.bigFive).map(([trait, data]: [string, any]) => (
                    <div key={trait} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-lg font-medium text-white capitalize">{trait}</h5>
                        <span className="text-2xl font-bold text-purple-300">{data.score}/100</span>
                      </div>
                      {formatReflectionText(data.analysis)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachment Style */}
            {data.comprehensiveAnalysis?.attachmentStyle && (
              <div className="bg-gradient-to-r from-pink-500/10 to-red-500/10 rounded-xl p-6 border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  Attachment Style: {data.comprehensiveAnalysis.attachmentStyle.primaryStyle}
                </h4>
                {formatReflectionText(data.comprehensiveAnalysis.attachmentStyle.analysis)}
              </div>
            )}

            {/* Shadow Work - The Hard Truths */}
            {data.comprehensiveAnalysis?.shadowWork && (
              <div className="bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-xl p-6 border border-red-400/30">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Shadow Work - The Hard Truths
                </h4>
                <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-4 mb-4">
                  <p className="text-red-200 text-sm">This section contains honest, direct feedback about patterns that may not serve you. It's meant to challenge and support your growth.</p>
                </div>
                {formatReflectionText(data.comprehensiveAnalysis.shadowWork.analysis)}
              </div>
            )}

            {/* Emotional Intelligence */}
            {data.comprehensiveAnalysis?.emotionalIntelligence && (
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-cyan-400" />
                  Emotional Intelligence Profile
                </h4>
                <div className="space-y-4">
                  {Object.entries(data.comprehensiveAnalysis.emotionalIntelligence).map(([area, info]: [string, any]) => (
                    <div key={area} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h5 className="text-lg font-medium text-white capitalize mb-2">{area.replace(/([A-Z])/g, ' $1').trim()}</h5>
                      <div className="text-cyan-300 text-sm mb-2">Level: {info.level}</div>
                      {formatReflectionText(info.analysis)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Core Values */}
            {data.comprehensiveAnalysis?.coreValues && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-400" />
                  Core Values & Motivations
                </h4>
                {formatReflectionText(data.comprehensiveAnalysis.coreValues.analysis)}
              </div>
            )}

            {/* Closing Reflection */}
            {data.closingReflection && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Final Reflection
                </h4>
                {formatReflectionText(data.closingReflection)}
              </div>
            )}

            {/* Personality Insights Details */}
            {data.personalityInsights && (
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-6 border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  Detailed Personality Insights
                </h4>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h5 className="text-lg font-medium text-white mb-2">Dominant Traits</h5>
                    <div className="flex flex-wrap gap-2">
                      {data.personalityInsights.dominantTraits?.map((trait, index) => (
                        <span key={index} className="bg-indigo-500/20 text-indigo-200 px-3 py-1 rounded-full text-sm">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h5 className="text-lg font-medium text-white mb-2">Communication Preference</h5>
                    <p className="text-white/90 leading-relaxed">{data.personalityInsights.communicationPreference}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h5 className="text-lg font-medium text-white mb-2">Emotional Processing</h5>
                    <p className="text-white/90 leading-relaxed">{data.personalityInsights.emotionalProcessing}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur rounded-xl p-8 border border-white/10 text-center">
            <Brain className="w-12 h-12 text-white/50 mx-auto mb-4" />
            <p className="text-white/70 text-lg mb-4">
              Continue engaging with your therapeutic journey to unlock deeper personality insights
            </p>
            <p className="text-white/50 text-sm">
              Your comprehensive analysis will develop as you share more through conversations and journaling
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Engagement Encouragement */}
      {(!data?.dataPoints.conversationMessages || data.dataPoints.conversationMessages < 3) && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-400 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Unlock Deeper Insights</h3>
          </div>
          <p className="text-white/80 mb-4">
            Continue your therapeutic journey to receive more comprehensive, personalized psychological analysis
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-lg p-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-300" />
              <span className="text-white/90 text-sm">Write more journal entries</span>
            </div>
            <div className="bg-white/10 rounded-lg p-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-300" />
              <span className="text-white/90 text-sm">Engage in therapeutic conversations</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalityReflection;
