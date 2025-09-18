import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Headphones, Play, Zap, Stethoscope, Star, Eye } from 'lucide-react';

interface VREnvironment {
  id: number;
  name: string;
  description: string;
  environment_type: string;
  therapeutic_focus: string;
  difficulty_level: string;
  duration_minutes: number;
  trigger_warnings: string[];
  is_available: boolean;
}

interface VRSession {
  id: number;
  environment_name: string;
  duration_minutes: number;
  effectiveness_rating: number;
  stress_reduction: number;
  session_notes: string;
  session_date: string;
  completion_status: string;
}

interface VRProgress {
  id: number;
  total_sessions: number;
  total_duration: number;
  average_effectiveness: number;
  stress_reduction_average: number;
  skill_development_level: string;

}

const VRTherapy: React.FC = () => {
  const [activeTab, setActiveTab] = useState('environments');

  const { data: environments } = useQuery<VREnvironment[]>({
    queryKey: ['/api/vr-environments'],
    queryFn: () => fetch('/api/vr-environments').then(res => res.json()),
  });

  const { data: sessions } = useQuery<VRSession[]>({
    queryKey: ['/api/vr-sessions/1'],
    queryFn: () => fetch('/api/vr-sessions/1').then(res => res.json()),
  });

  const { data: progress } = useQuery<VRProgress>({
    queryKey: ['/api/vr-progress/1'],
    queryFn: () => fetch('/api/vr-progress/1').then(res => res.json()),
  });

  const renderEnvironmentsTab = () => {
    return (
      <div className="space-y-6">
        {/* Environment Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {environments?.map((env) => (
            <div key={env.id} className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold theme-text">{env.name}</h3>
                <div className="flex items-center space-x-1">
                  {env.difficulty_level === 'beginner' && <span className="text-green-400">â—</span>}
                  {env.difficulty_level === 'intermediate' && <span className="text-yellow-400">â—</span>}
                  {env.difficulty_level === 'advanced' && <span className="text-red-400">â—</span>}
                  <span className="theme-text/60 text-xs capitalize">{env.difficulty_level}</span>
                </div>
              </div>
              
              <p className="theme-text/80 text-sm mb-4">{env.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="theme-text/60">Focus:</span>
                  <span className="theme-text capitalize">{env.therapeutic_focus}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="theme-text/60">Duration:</span>
                  <span className="theme-text">{env.duration_minutes} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="theme-text/60">Type:</span>
                  <span className="theme-text capitalize">{env.environment_type}</span>
                </div>
              </div>

              {env.trigger_warnings?.length > 0 && (
                <div className="mb-4">
                  <p className="theme-text/60 text-xs mb-1">Trigger Warnings:</p>
                  <div className="flex flex-wrap gap-1">
                    {env.trigger_warnings.map((warning, index) => (
                      <span key={index} className="px-2 py-1 bg-red-500/20 text-red-200 text-xs rounded">
                        {warning}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button 
                className={`w-full py-2 rounded-lg theme-text font-medium ${
                  env.is_available 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'bg-gray-500/20 cursor-not-allowed'
                }`}
                disabled={!env.is_available}
              >
                {env.is_available ? 'Start Experience' : 'Coming Soon'}
              </button>
            </div>
          )) || <p className="theme-text/60">No VR environments available</p>}
        </div>
      </div>
    );
  };

  const renderSessionsTab = () => {
    return (
      <div className="space-y-6">
        {/* Session History */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Recent Sessions</h3>
          <div className="space-y-4">
            {sessions?.map((session) => (
              <div key={session.id} className="p-4 bg-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="theme-text font-medium">{session.environment_name}</h4>
                  <span className="theme-text/60 text-sm">{session.duration_minutes} min</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <p className="theme-text/60 text-xs">Effectiveness</p>
                    <div className="flex items-center justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < session.effectiveness_rating ? 'text-yellow-400 fill-current' : 'theme-text/30'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="theme-text/60 text-xs">Stress Reduction</p>
                    <p className="theme-text font-bold">{session.stress_reduction}%</p>
                  </div>
                  <div className="text-center">
                    <p className="theme-text/60 text-xs">Status</p>
                    <p className="theme-text capitalize">{session.completion_status}</p>
                  </div>
                  <div className="text-center">
                    <p className="theme-text/60 text-xs">Date</p>
                    <p className="theme-text">{new Date(session.session_date).toLocaleDateString()}</p>
                  </div>
                </div>

                {session.session_notes && (
                  <div className="p-3 bg-white/10 rounded-lg">
                    <p className="theme-text/60 text-xs mb-1">Session Notes:</p>
                    <p className="theme-text/80 text-sm">{session.session_notes}</p>
                  </div>
                )}
              </div>
            )) || <p className="theme-text/60">No sessions recorded</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderProgressTab = () => {
    return (
      <div className="space-y-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text/80">Total Sessions</p>
                <p className="text-2xl font-bold theme-text">{progress?.total_sessions || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <Headphones className="w-6 h-6 theme-text" />
              </div>
            </div>
          </div>

          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text/80">Total Duration</p>
                <p className="text-2xl font-bold theme-text">{progress?.total_duration || 0}</p>
                <p className="text-xs theme-text/60">minutes</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <Play className="w-6 h-6 theme-text" />
              </div>
            </div>
          </div>

          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text/80">Avg Effectiveness</p>
                <p className="text-2xl font-bold theme-text">{progress?.average_effectiveness || 0}</p>
                <p className="text-xs theme-text/60">out of 5</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <Star className="w-6 h-6 theme-text" />
              </div>
            </div>
          </div>

          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text/80">Stress Reduction</p>
                <p className="text-2xl font-bold theme-text">{progress?.stress_reduction_average || 0}%</p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <Zap className="w-6 h-6 theme-text" />
              </div>
            </div>
          </div>
        </div>

        {/* Skill Development */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Skill Development</h3>
          <div className="flex items-center justify-between mb-4">
            <span className="theme-text/80">Current Level</span>
            <span className="theme-text font-bold capitalize">{progress?.skill_development_level || 'Beginner'}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 mb-4">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-300"
              style={{ 
                width: `${
                  progress?.skill_development_level === 'beginner' ? 25 :
                  progress?.skill_development_level === 'intermediate' ? 50 :
                  progress?.skill_development_level === 'advanced' ? 75 :
                  progress?.skill_development_level === 'expert' ? 100 : 0
                }%` 
              }}
            ></div>
          </div>
        </div>


      </div>
    );
  };

  const renderAccessibilityTab = () => {
    return (
      <div className="space-y-6">
        {/* Accessibility Settings */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Accessibility Features</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="theme-text font-medium">Audio Descriptions</p>
                <p className="theme-text/60 text-sm">Narrated guidance for visual elements</p>
              </div>
              <div className="w-12 h-6 bg-white/20 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-6 transition-all"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="theme-text font-medium">Simplified Controls</p>
                <p className="theme-text/60 text-sm">Reduced complexity for motor limitations</p>
              </div>
              <div className="w-12 h-6 bg-white/20 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-all"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="theme-text font-medium">Motion Sensitivity</p>
                <p className="theme-text/60 text-sm">Reduced motion for comfort</p>
              </div>
              <div className="w-12 h-6 bg-white/20 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-all"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div>
                <p className="theme-text font-medium">Trigger Warnings</p>
                <p className="theme-text/60 text-sm">Content warnings before sessions</p>
              </div>
              <div className="w-12 h-6 bg-white/20 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-6 transition-all"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Features */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Emergency Features</h3>
          <div className="space-y-3">
            <button className="w-full p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg theme-text">
              <div className="flex items-center justify-center space-x-2">
                <Eye className="w-5 h-5" />
                <span className="font-medium">Panic Exit</span>
              </div>
              <p className="text-red-200 text-sm mt-1">Instantly return to safe environment</p>
            </button>

            <button className="w-full p-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-700 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center space-x-2">
                <Stethoscope className="w-5 h-5" />
                <span className="font-medium">Grounding Exercise</span>
              </div>
              <p className="text-gray-600 text-sm mt-1">Quick calming technique</p>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen theme-primary p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold theme-text mb-2">VR Therapy Studio</h1>
          <p className="theme-text/80">Immersive therapeutic experiences for mindfulness and healing</p>
        </div>

        {/* Navigation Tabs */}
        <div className="theme-card rounded-xl p-2 mb-6 border border-silver hover:border-2 hover:animate-shimmer">
          <div className="grid grid-cols-2 gap-2 md:flex md:space-x-2">
            {[
              { id: 'environments', label: 'Environments', icon: Headphones },
              { id: 'sessions', label: 'History', icon: Play },
              { id: 'progress', label: 'Progress', icon: Star },
              { id: 'accessibility', label: 'Access', icon: Eye },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`theme-button flex items-center justify-center space-x-1 px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'shadow-lg border-2 animate-shimmer'
                    : 'hover:shadow-md border hover:border-2 hover:animate-shimmer'
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'environments' && renderEnvironmentsTab()}
        {activeTab === 'sessions' && renderSessionsTab()}
        {activeTab === 'progress' && renderProgressTab()}
        {activeTab === 'accessibility' && renderAccessibilityTab()}
      </div>
    </div>
  );
};

export default VRTherapy;
