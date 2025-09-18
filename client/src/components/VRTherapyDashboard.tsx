import { getCurrentUserId } from "../utils/userSession";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface VrEnvironment {
  id: number;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  environmentType: string;
  scenePath: string;
  instructions: string[];
  therapeuticGoals: string[];
  contraindications: string[];
  tags: string[];
}

interface VrSession {
  id: number;
  userId: number;
  environmentId: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  completionStatus: string;
  effectiveness?: number;
  stressLevel?: any;
  heartRate?: any;
  sessionGoals: string[];
  personalizedSettings: any;
  sideEffects?: string[];
  notes?: string;
}

interface VrTherapeuticPlan {
  id: number;
  userId: number;
  planName: string;
  therapeuticGoal: string;
  environments: any[];
  totalStages: number;
  estimatedDuration: number;
  adaptiveSettings: any;
}

interface VrAccessibilityProfile {
  id: number;
  userId: number;
  motionSensitivity: string;
  comfortSettings: any;
  visualAdjustments: any;
  audioPreferences: any;
}

export default function VRTherapyDashboard() {
  const [activeTab, setActiveTab] = useState('environments');
  const [selectedEnvironment, setSelectedEnvironment] = useState<VrEnvironment | null>(null);
  const [activeSession, setActiveSession] = useState<VrSession | null>(null);
  const [sessionGoals, setSessionGoals] = useState<string[]>([]);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    motionSensitivity: 'medium',
    comfortSettings: {},
    visualAdjustments: {},
    audioPreferences: {}
  });

  const queryClient = useQueryClient();
  const userId = getCurrentUserId(); // Would get from auth context

  // Fetch VR environments
  const { data: environments = [], isLoading: environmentsLoading } = useQuery({
    queryKey: ['/api/vr/environments'],
    queryFn: async () => {
      const response = await fetch('/api/vr/environments');
      const data = await response.json();
      return data.environments || [];
    }
  });

  // Fetch user's VR sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/vr/sessions', userId],
    queryFn: async () => {
      const response = await fetch(`/api/vr/sessions/${userId}`);
      const data = await response.json();
      return data.sessions || [];
    }
  });

  // Fetch user's VR progress
  const { data: progress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['/api/vr/progress', userId],
    queryFn: async () => {
      const response = await fetch(`/api/vr/progress/${userId}`);
      const data = await response.json();
      return data.progress || [];
    }
  });

  // Fetch VR therapeutic plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/vr/therapeutic-plans', userId],
    queryFn: async () => {
      const response = await fetch(`/api/vr/therapeutic-plans/${userId}`);
      const data = await response.json();
      return data.plans || [];
    }
  });

  // Fetch accessibility profile
  const { data: accessibilityProfile } = useQuery({
    queryKey: ['/api/vr/accessibility-profile', userId],
    queryFn: async () => {
      const response = await fetch(`/api/vr/accessibility-profile/${userId}`);
      const data = await response.json();
      return data.profile || null;
    }
  });

  // Start VR session mutation
  const startSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await fetch('/api/vr/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      return response.json();
    },
    onSuccess: (data) => {
      setActiveSession(data.session);
      setIsSessionModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/vr/sessions', userId] });
    }
  });

  // Complete VR session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async ({ sessionId, sessionData }: { sessionId: number, sessionData: any }) => {
      const response = await fetch(`/api/vr/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      return response.json();
    },
    onSuccess: () => {
      setActiveSession(null);
      queryClient.invalidateQueries({ queryKey: ['/api/vr/sessions', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/vr/progress', userId] });
    }
  });

  // Save accessibility profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await fetch(`/api/vr/accessibility-profile/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      return response.json();
    },
    onSuccess: () => {
      setIsProfileModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/vr/accessibility-profile', userId] });
    }
  });

  const handleStartSession = (environment: VrEnvironment) => {
    setSelectedEnvironment(environment);
    setIsSessionModalOpen(true);
  };

  const handleSessionStart = () => {
    if (!selectedEnvironment) return;

    startSessionMutation.mutate({
      userId,
      environmentId: selectedEnvironment.id,
      sessionGoals,
      personalizedSettings: accessibilitySettings
    });
  };

  const handleCompleteSession = (effectiveness: number, notes: string) => {
    if (!activeSession) return;

    completeSessionMutation.mutate({
      sessionId: activeSession.id,
      sessionData: {
        effectiveness,
        notes,
        stressLevel: { before: 7, after: 4 }, // Would be from real sensors
        heartRate: { average: 72, peak: 85 }, // Would be from real sensors
        interactions: ['completed_breathing', 'used_grounding'],
        sideEffects: []
      }
    });
  };

  const handleSaveProfile = () => {
    saveProfileMutation.mutate(accessibilitySettings);
  };

  const getEnvironmentsByCategory = (category: string) => {
    return environments.filter((env: VrEnvironment) => env.category === category);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">VR Therapeutic Experiences</h1>
              <p className="text-gray-600">Immersive mindfulness, relaxation, and exposure therapy</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
              >
                Accessibility Settings
              </button>
              {activeSession && (
                <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl">
                  Session Active
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="w-full bg-[var(--theme-surface)] rounded-lg p-1 mb-6 shadow-lg border-2 border-[var(--theme-accent)]">
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'environments', label: 'Environments', icon: 'ðŸŒŸ' },
              { id: 'sessions', label: 'Sessions', icon: 'ðŸ“Š' },
              { id: 'progress', label: 'Progress', icon: 'ðŸ“ˆ' },
              { id: 'plans', label: 'Plans', icon: 'ðŸŽ¯' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shimmer-border w-full px-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent)] text-white shadow-lg border-2 border-silver animate-shimmer'
                    : 'bg-gradient-to-r from-[var(--theme-primary-light)] to-[var(--theme-surface)] text-white hover:from-[var(--theme-primary)] hover:to-[var(--theme-accent)] hover:shadow-md border border-silver hover:border-2 hover:animate-shimmer'
                }`}
              >
                <div className="text-lg mb-1">{tab.icon}</div>
                <div className="text-xs leading-tight">{tab.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {activeTab === 'environments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Available VR Environments</h2>
              
              {environmentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading environments...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {['mindfulness', 'relaxation', 'exposure', 'grounding'].map((category) => {
                    const categoryEnvs = getEnvironmentsByCategory(category);
                    if (categoryEnvs.length === 0) return null;

                    return (
                      <div key={category}>
                        <h3 className="text-xl font-semibold text-gray-700 mb-4 capitalize">
                          {category} Therapy
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoryEnvs.map((environment: VrEnvironment) => (
                            <div key={environment.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <h4 className="font-semibold text-gray-800 mb-2">{environment.name}</h4>
                              <p className="text-gray-600 text-sm mb-3">{environment.description}</p>
                              <div className="flex justify-between items-center mb-3">
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                  environment.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                  environment.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {environment.difficulty}
                                </span>
                                <span className="text-sm text-gray-500">{environment.duration} min</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {environment.therapeuticGoals.slice(0, 2).map((goal, index) => (
                                  <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs">
                                    {goal}
                                  </span>
                                ))}
                              </div>
                              <button
                                onClick={() => handleStartSession(environment)}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                disabled={activeSession !== null}
                              >
                                {activeSession ? 'Session Active' : 'Start Session'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">My VR Sessions</h2>
              
              {activeSession && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-green-800 mb-2">Active Session</h3>
                  <p className="text-green-700 mb-3">
                    Session started at {new Date(activeSession.startTime).toLocaleTimeString()}
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleCompleteSession(8, 'Great session, felt very relaxed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Complete Session (Good)
                    </button>
                    <button
                      onClick={() => handleCompleteSession(5, 'Had some difficulties with motion')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Complete Session (OK)
                    </button>
                  </div>
                </div>
              )}

              {sessionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading sessions...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.slice(0, 10).map((session: VrSession) => (
                    <div key={session.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800">
                          Environment #{session.environmentId}
                        </h4>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          session.completionStatus === 'completed' ? 'bg-green-100 text-green-700' :
                          session.completionStatus === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {session.completionStatus}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {new Date(session.startTime).toLocaleDateString()} - 
                        {session.duration ? ` ${Math.round(session.duration / 60)} minutes` : ' In progress'}
                      </p>
                      {session.effectiveness && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Effectiveness:</span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                              <span
                                key={star}
                                className={star <= session.effectiveness! ? 'text-yellow-400' : 'text-gray-300'}
                              >
                                â­
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {session.notes && (
                        <p className="text-gray-700 text-sm mt-2">{session.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">VR Therapy Progress</h2>
              
              {progressLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading progress...</p>
                </div>
              ) : progress.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {progress.map((prog: any) => (
                    <div key={prog.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Environment #{prog.environmentId}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sessions:</span>
                          <span className="font-medium">{prog.sessionCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Time:</span>
                          <span className="font-medium">{Math.round(prog.totalDuration / 60)} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg Effectiveness:</span>
                          <span className="font-medium">{prog.averageEffectiveness.toFixed(1)}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Best Score:</span>
                          <span className="font-medium">{prog.bestScore}/10</span>
                        </div>
                      </div>
                      {prog.achievements && prog.achievements.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Recent Achievements:</p>
                          <div className="flex flex-wrap gap-1">
                            {prog.achievements.slice(0, 3).map((achievement: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                                {achievement}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No VR therapy progress yet. Start your first session to see your progress!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Therapeutic Plans</h2>
              
              {plansLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading plans...</p>
                </div>
              ) : plans.length > 0 ? (
                <div className="space-y-4">
                  {plans.map((plan: VrTherapeuticPlan) => (
                    <div key={plan.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2">{plan.planName}</h4>
                      <p className="text-gray-600 mb-3">Goal: {plan.therapeuticGoal}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Stages:</span>
                          <p className="font-medium">{plan.totalStages}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <p className="font-medium">{plan.estimatedDuration} days</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Environments:</span>
                          <p className="font-medium">{plan.environments?.length || 0}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <p className="font-medium text-green-600">Active</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No therapeutic plans yet. Contact your therapist to create a personalized VR therapy plan.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Session Setup Modal */}
      {isSessionModalOpen && selectedEnvironment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Start VR Session</h3>
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">{selectedEnvironment.name}</h4>
              <p className="text-gray-600 text-sm mb-3">{selectedEnvironment.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Duration: {selectedEnvironment.duration} min</span>
                <span>Difficulty: {selectedEnvironment.difficulty}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Goals (optional)
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={3}
                placeholder="What would you like to focus on in this session?"
                value={sessionGoals.join('\n')}
                onChange={(e) => setSessionGoals(e.target.value.split('\n').filter(g => g.trim()))}
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setIsSessionModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSessionStart}
                disabled={startSessionMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {startSessionMutation.isPending ? 'Starting...' : 'Start Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">VR Accessibility Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motion Sensitivity
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={accessibilitySettings.motionSensitivity}
                  onChange={(e) => setAccessibilitySettings(prev => ({
                    ...prev,
                    motionSensitivity: e.target.value
                  }))}
                >
                  <option value="low">Low - Full motion and transitions</option>
                  <option value="medium">Medium - Reduced motion</option>
                  <option value="high">High - Minimal motion, teleportation only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comfort Features
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Snap turning (reduces motion sickness)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Comfort vignette (reduces peripheral vision)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Ground reference grid</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visual Adjustments
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Brightness</label>
                    <input type="range" min="0" max="100" className="w-full" defaultValue="50" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Contrast</label>
                    <input type="range" min="0" max="100" className="w-full" defaultValue="50" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audio Preferences
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Master Volume</label>
                    <input type="range" min="0" max="100" className="w-full" defaultValue="70" />
                  </div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Enable spatial audio</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Voice guidance</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saveProfileMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {saveProfileMutation.isPending ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
