import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  RefreshCw, Brain, TrendingUp, User, 
  Sparkles, Heart, Target, Zap, MessageCircle, Activity, Users, Star, Lightbulb, Shield, Compass, ChevronDown, ChevronUp, Search, Calendar
} from 'lucide-react';
import { getCurrentUserId } from '../utils/userSession';

interface ComprehensiveAnalysis {
  overallProfile: {
    dominantTraits: string[];
    personalityType: string;
    communicationStyle: string;
    emotionalProfile: string;
    behavioralSignature: string;
    strengthsOverview: string[];
    challengesOverview: string[];
    uniqueCharacteristics: string[];
  };
  detailedDomainAnalysis: {
    cognitive: DomainAnalysis;
    emotional: DomainAnalysis;
    communication: DomainAnalysis;
    behavioral: DomainAnalysis;
    interpersonal: DomainAnalysis;
    personality: DomainAnalysis;
    values: DomainAnalysis;
    motivational: DomainAnalysis;
    coping: DomainAnalysis;
  };
  therapeuticInsights: {
    therapeuticAlliance: string;
    recommendedApproaches: string[];
    progressPredictors: string[];
    challengeAreas: string[];
    resilienceFactors: string[];
    growthTrajectory: string;
  };
  actionableRecommendations: {
    immediateSteps: string[];
    shortTermGoals: string[];
    longTermDevelopment: string[];
    therapeuticPriorities: string[];
    wellnessStrategies: string[];
  };
  dataPoints: {
    analysisConfidence: number;
    dataRichness: number;
    keyDataSources: string[];
    analysisDepth: string;
    totalInsights: number;
  };
}

interface DomainAnalysis {
  domainScore: number;
  keyFindings: string[];
  specificTraits: { [key: string]: number };
  narrativeAnalysis: string;
  growthOpportunities: string[];
  therapeuticFocus: string[];
}

interface ComprehensivePersonalityReflectionProps {
  userId?: number;
}

const ComprehensivePersonalityReflection: React.FC<ComprehensivePersonalityReflectionProps> = ({ userId }) => {
  const currentUserId = userId || getCurrentUserId();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [showAllTraits, setShowAllTraits] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Rachel');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['comprehensive-analysis', currentUserId, refreshTrigger],
    queryFn: async (): Promise<{ analysis: ComprehensiveAnalysis }> => {
      const deviceFingerprint = localStorage.getItem('deviceFingerprint') || 
                               `device_${Math.random().toString(36).substring(2, 15)}`;
      const sessionId = localStorage.getItem('sessionId') || 
                       `session_${Math.random().toString(36).substring(2, 15)}`;
      
      localStorage.setItem('deviceFingerprint', deviceFingerprint);
      localStorage.setItem('sessionId', sessionId);
      
      const response = await fetch(`/api/personality-insights`, {
        headers: {
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-ID': sessionId
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch comprehensive analysis');
      }
      return response.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    refetch();
  };

  // Domain icons mapping
  const getDomainIcon = (domain: string) => {
    const icons = {
      cognitive: Brain,
      emotional: Heart,
      communication: MessageCircle,
      behavioral: Activity,
      interpersonal: Users,
      personality: User,
      values: Compass,
      motivational: Target,
      coping: Shield
    };
    return icons[domain as keyof typeof icons] || Brain;
  };

  // Domain colors mapping
  const getDomainColor = (domain: string) => {
    const colors = {
      cognitive: 'from-blue-500 to-indigo-500',
      emotional: 'from-pink-500 to-red-500',
      communication: 'from-green-500 to-emerald-500',
      behavioral: 'from-purple-500 to-violet-500',
      interpersonal: 'from-orange-500 to-amber-500',
      personality: 'from-cyan-500 to-teal-500',
      values: 'from-yellow-500 to-orange-500',
      motivational: 'from-red-500 to-pink-500',
      coping: 'from-emerald-500 to-green-500'
    };
    return colors[domain as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  // Filter traits based on search
  const filterTraits = (traits: { [key: string]: number }) => {
    if (!searchTerm) return traits;
    
    const filtered: { [key: string]: number } = {};
    Object.entries(traits).forEach(([trait, score]) => {
      if (trait.toLowerCase().replace(/_/g, ' ').includes(searchTerm.toLowerCase())) {
        filtered[trait] = score;
      }
    });
    return filtered;
  };

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-green-400';
    if (score >= 7.0) return 'text-blue-400';
    if (score >= 5.5) return 'text-yellow-400';
    return 'text-orange-400';
  };

  // Get score description
  const getScoreDescription = (score: number) => {
    if (score >= 8.5) return 'Exceptional Strength';
    if (score >= 7.0) return 'Strong Capability';
    if (score >= 5.5) return 'Developing Area';
    return 'Growth Opportunity';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen theme-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <span className="ml-4 text-white text-lg">Generating comprehensive 190-point personality analysis...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen theme-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-6">
            <p className="text-red-200">Unable to generate comprehensive analysis. Continue engaging with the platform to build data for analysis.</p>
            <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const analysis = data.analysis;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#3949ab] p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-4 rounded-xl">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                  190-Point Comprehensive Analysis
                  <Sparkles className="w-8 h-8 text-yellow-300" />
                </h1>
                <p className="text-white/70 text-lg">Professional-grade psychological assessment across 9 domains</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                  <span>Confidence: {analysis.dataPoints.analysisConfidence}%</span>
                  <span>Data Richness: {analysis.dataPoints.dataRichness}%</span>
                  <span>Total Insights: {analysis.dataPoints.totalInsights}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="text"
                placeholder="Search specific traits or dimensions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>
        </div>

        {/* Overall Personality Profile */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-400" />
            Overall Personality Profile
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Personality Type</h3>
                <p className="text-purple-200 text-xl font-medium">{analysis.overallProfile.personalityType}</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Communication Style</h3>
                <p className="text-blue-200 leading-relaxed">{analysis.overallProfile.communicationStyle}</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Emotional Profile</h3>
                <p className="text-green-200 leading-relaxed">{analysis.overallProfile.emotionalProfile}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Dominant Traits</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.overallProfile.dominantTraits.slice(0, 8).map((trait, index) => (
                    <span key={index} className="bg-orange-400/30 text-orange-100 px-3 py-1 rounded-full text-sm">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Key Strengths</h3>
                <div className="space-y-2">
                  {analysis.overallProfile.strengthsOverview.slice(0, 4).map((strength, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span className="text-teal-200 text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Domain Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(analysis.detailedDomainAnalysis).map(([domain, domainData]) => {
            const Icon = getDomainIcon(domain);
            const isExpanded = selectedDomain === domain;
            const traits = filterTraits(domainData.specificTraits || {});
            
            return (
              <div key={domain} className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden">
                <div className={`bg-gradient-to-r ${getDomainColor(domain)} p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-white" />
                      <div>
                        <h3 className="text-lg font-semibold text-white capitalize">
                          {domain.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="bg-white/20 rounded-full px-2 py-1">
                            <span className="text-white text-sm font-medium">
                              {domainData.domainScore?.toFixed(1) || '5.5'}/10
                            </span>
                          </div>
                          <span className="text-white/80 text-sm">
                            {Object.keys(traits).length} dimensions
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDomain(isExpanded ? null : domain)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  {/* Key Findings */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-white/80 mb-2">Key Findings</h4>
                    <div className="space-y-1">
                      {(domainData.keyFindings || []).slice(0, 2).map((finding, index) => (
                        <p key={index} className="text-white/70 text-sm leading-relaxed">{finding}</p>
                      ))}
                    </div>
                  </div>
                  
                  {/* Top Traits Preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-white/80 mb-2">Top Traits</h4>
                    <div className="space-y-2">
                      {Object.entries(traits)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, isExpanded ? Object.keys(traits).length : 3)
                        .map(([trait, score]) => (
                          <div key={trait} className="flex items-center justify-between">
                            <span className="text-white/90 text-sm capitalize">
                              {trait.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                                {score.toFixed(1)}
                              </span>
                              <div className="w-16 bg-white/20 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full bg-gradient-to-r ${getDomainColor(domain)}`}
                                  style={{ width: `${(score / 10) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="space-y-4 border-t border-white/20 pt-4">
                      {/* Narrative Analysis */}
                      <div>
                        <h4 className="text-sm font-semibold text-white/80 mb-2">Detailed Analysis</h4>
                        <p className="text-white/70 text-sm leading-relaxed">{domainData.narrativeAnalysis}</p>
                      </div>
                      
                      {/* Growth Opportunities */}
                      {domainData.growthOpportunities && domainData.growthOpportunities.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-white/80 mb-2">Growth Opportunities</h4>
                          <div className="space-y-1">
                            {domainData.growthOpportunities.map((opportunity, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <Target className="w-3 h-3 text-orange-400 mt-1 flex-shrink-0" />
                                <span className="text-white/70 text-sm">{opportunity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Therapeutic Focus */}
                      {domainData.therapeuticFocus && domainData.therapeuticFocus.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-white/80 mb-2">Therapeutic Focus</h4>
                          <div className="space-y-1">
                            {domainData.therapeuticFocus.map((focus, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <Lightbulb className="w-3 h-3 text-yellow-400 mt-1 flex-shrink-0" />
                                <span className="text-white/70 text-sm">{focus}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!isExpanded && Object.keys(traits).length > 3 && (
                    <button
                      onClick={() => setSelectedDomain(domain)}
                      className="w-full text-center text-white/60 text-sm hover:text-white/80 transition-colors"
                    >
                      View {Object.keys(traits).length - 3} more traits...
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Therapeutic Insights */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-yellow-400" />
            Therapeutic Insights & Recommendations
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Therapeutic Alliance</h3>
                <p className="text-purple-200 leading-relaxed">{analysis.therapeuticInsights.therapeuticAlliance}</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Recommended Approaches</h3>
                <div className="space-y-2">
                  {analysis.therapeuticInsights.recommendedApproaches.map((approach, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-green-200 text-sm">{approach}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Progress Predictors</h3>
                <div className="space-y-2">
                  {analysis.therapeuticInsights.progressPredictors.map((predictor, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-blue-200 text-sm">{predictor}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Resilience Factors</h3>
                <div className="space-y-2">
                  {analysis.therapeuticInsights.resilienceFactors.map((factor, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      <span className="text-orange-200 text-sm">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Target className="w-6 h-6 text-green-400" />
            Actionable Development Plan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-400" />
                Immediate Steps
              </h3>
              <div className="space-y-2">
                {analysis.actionableRecommendations.immediateSteps.map((step, index) => (
                  <div key={index} className="text-green-200 text-sm leading-relaxed">
                    {index + 1}. {step}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Short-term Goals
              </h3>
              <div className="space-y-2">
                {analysis.actionableRecommendations.shortTermGoals.map((goal, index) => (
                  <div key={index} className="text-blue-200 text-sm leading-relaxed">
                    {index + 1}. {goal}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-400" />
                Long-term Development
              </h3>
              <div className="space-y-2">
                {analysis.actionableRecommendations.longTermDevelopment.map((development, index) => (
                  <div key={index} className="text-purple-200 text-sm leading-relaxed">
                    {index + 1}. {development}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Metadata */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-white/60 text-sm">
            <div className="flex items-center gap-4">
              <span>Analysis Depth: {analysis.dataPoints.analysisDepth}</span>
              <span>Data Sources: {analysis.dataPoints.keyDataSources.length}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Generated: {new Date().toLocaleString()}</span>
              <span>Version: 2.0 (190-Point Comprehensive)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensivePersonalityReflection;
