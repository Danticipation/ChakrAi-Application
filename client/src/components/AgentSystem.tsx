import { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Heart, Zap, Users, CheckCircle, ArrowRight, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface TherapeuticAgent {
  id: number;
  name: string;
  type: string;
  description: string;
  specializations: string[];
  isActive: boolean;
}

interface AgentSession {
  id: number;
  userId: number;
  agentId: number;
  sessionType: string;
  objective: string;
  status: string;
  conversationHistory: any[];
  insights: any;
  recommendations: any;
}

interface AgentSystemProps {
  userId: number;
}

const agentIcons = {
  cbt: Brain,
  mindfulness: Heart,
  self_compassion: Users,
  anxiety: Zap,
};

const agentColors = {
  cbt: 'bg-blue-50 border-blue-200 text-blue-800',
  mindfulness: 'bg-green-50 border-green-200 text-green-800',
  self_compassion: 'bg-purple-50 border-purple-200 text-purple-800',
  anxiety: 'bg-orange-50 border-orange-200 text-orange-800',
};

function AgentSystem({ userId }: AgentSystemProps) {
  const [agents, setAgents] = useState<TherapeuticAgent[]>([]);
  const [activeSession, setActiveSession] = useState<AgentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [objective, setObjective] = useState('');
  const [showAgentSelection, setShowAgentSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  
  // Refs for focus management
  const agentSelectionRef = useRef<HTMLDivElement>(null);
  const selectedAgentCardRef = useRef<HTMLButtonElement>(null);
  const objectiveInputRef = useRef<HTMLTextAreaElement>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
    checkActiveSession();
  }, [userId]);

  // Focus management for accessibility
  useEffect(() => {
    if (showAgentSelection && agentSelectionRef.current) {
      agentSelectionRef.current.focus();
    }
  }, [showAgentSelection]);

  useEffect(() => {
    if (selectedAgent && selectedAgentCardRef.current) {
      selectedAgentCardRef.current.focus();
    }
  }, [selectedAgent]);

  useEffect(() => {
    if (selectedAgent && objectiveInputRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        objectiveInputRef.current?.focus();
      }, 100);
    }
  }, [selectedAgent]);

  const loadAgents = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/agents');
      
      if (!response.ok) {
        throw new Error(`Failed to load agents: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setAgents(data.agents || []);
      
      toast({
        title: "Agents loaded successfully",
        description: `${data.agents?.length || 0} therapeutic specialists available`,
        variant: "success"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load agents';
      setError(errorMessage);
      console.error('Failed to load agents:', error);
      
      toast({
        title: "Failed to load agents",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const checkActiveSession = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/agents/session/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to check session: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.hasActiveSession) {
        setActiveSession(data.session);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check active session';
      setError(errorMessage);
      console.error('Failed to check active session:', error);
      
      toast({
        title: "Session check failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [userId, toast]);

  const startAgentSession = useCallback(async (agentType: string, sessionObjective: string) => {
    setSessionLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/agents/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          agentType,
          objective: sessionObjective
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setActiveSession(data.session);
        setShowAgentSelection(false);
        resetAgentSelection();
        
        // Refetch agents to keep display current
        await loadAgents();
        
        toast({
          title: "Session started successfully",
          description: `Connected with ${agents.find(a => a.type === agentType)?.name || 'specialist'}`,
          variant: "success"
        });
      } else {
        throw new Error(data.message || 'Failed to start session');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start agent session';
      setError(errorMessage);
      console.error('Failed to start agent session:', error);
      
      toast({
        title: "Failed to start session",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSessionLoading(false);
    }
  }, [userId, agents, loadAgents, toast]);

  const endSession = useCallback(async () => {
    setSessionLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/agents/end-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.status} ${response.statusText}`);
      }

      setActiveSession(null);
      setShowEndSessionConfirm(false);
      
      // Refetch agents to keep display current
      await loadAgents();
      
      toast({
        title: "Session ended",
        description: "You've been disconnected from the specialist",
        variant: "success"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to end session';
      setError(errorMessage);
      console.error('Failed to end session:', error);
      
      toast({
        title: "Failed to end session",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSessionLoading(false);
    }
  }, [userId, loadAgents, toast]);

  // Reset agent selection state for fresh UX
  const resetAgentSelection = useCallback(() => {
    setSelectedAgent(null);
    setObjective('');
  }, []);

  const handleAgentSelection = useCallback((agentType: string) => {
    setSelectedAgent(agentType);
    
    // Set default objectives based on agent type
    const defaultObjectives = {
      cbt: 'identifying and working through negative thought patterns',
      mindfulness: 'learning stress reduction and grounding techniques',
      self_compassion: 'developing a kinder inner dialogue',
      anxiety: 'managing worry and developing coping strategies'
    };
    
    setObjective(defaultObjectives[agentType as keyof typeof defaultObjectives] || '');
  }, []);

  const handleBackClick = useCallback(() => {
    resetAgentSelection();
  }, [resetAgentSelection]);

  const handleCancelSelection = useCallback(() => {
    setShowAgentSelection(false);
    resetAgentSelection();
  }, [resetAgentSelection]);

  const confirmEndSession = useCallback(() => {
    setShowEndSessionConfirm(true);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    loadAgents();
    checkActiveSession();
  }, [loadAgents, checkActiveSession]);

  const getAgentIcon = (type: string) => {
    const IconComponent = agentIcons[type as keyof typeof agentIcons] || Brain;
    return <IconComponent className="w-6 h-6" />;
  };

  const getAgentColorClass = (type: string) => {
    return agentColors[type as keyof typeof agentColors] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  // Loading spinner component
  const LoadingSpinner = ({ message = "Loading..." }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center h-64 space-y-4" role="status" aria-label={message}>
      <Loader2 className="animate-spin h-12 w-12 text-blue-600" aria-hidden="true" />
      <p className="text-sm theme-text-secondary">{message}</p>
    </div>
  );

  // Error message component with retry
  const ErrorMessage = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center px-4">
      <AlertCircle className="h-12 w-12 text-red-500" aria-hidden="true" />
      <div className="space-y-2">
        <h3 className="font-semibold text-red-800">Something went wrong</h3>
        <p className="text-sm text-red-600">{message}</p>
      </div>
      <Button onClick={onRetry} variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  );

  if (loading) {
    return <LoadingSpinner message="Loading therapeutic specialists..." />;
  }

  if (error && !agents.length) {
    return <ErrorMessage message={error} onRetry={handleRetry} />;
  }

  return (
    <div className="space-y-6 p-4 theme-background min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold theme-text">Therapeutic Agent System</h2>
        <p className="theme-text-secondary text-sm">
          Connect with specialized AI agents for targeted therapeutic support
        </p>
      </div>

      {/* Active Session Display */}
      {activeSession && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {getAgentIcon(activeSession.sessionType)}
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Active Session: {agents.find(a => a.type === activeSession.sessionType)?.name}
                  </h3>
                  <p className="text-sm text-blue-700">
                    Working on: {activeSession.objective}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={confirmEndSession}
                disabled={sessionLoading}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
                aria-label="End current therapeutic session"
              >
                {sessionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                End Session
              </Button>
            </div>
            <div className="text-sm text-blue-800 bg-blue-100 p-3 rounded-lg">
              <p className="font-medium mb-2">Session Status: Active</p>
              <p>Continue your conversation in the main chat to work with this specialist.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Selection */}
      {!activeSession && (
        <>
          <div className="text-center">
            <Button 
              onClick={() => setShowAgentSelection(true)}
              className="theme-primary hover:theme-accent theme-text px-8 py-3"
            >
              <Brain className="w-5 h-5 mr-2" />
              Connect with Specialist
            </Button>
          </div>

          {showAgentSelection && (
            <Card 
              className="theme-card border-[var(--theme-accent)]"
              ref={agentSelectionRef}
              tabIndex={-1}
              role="dialog"
              aria-labelledby="agent-selection-title"
              aria-describedby="agent-selection-description"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle id="agent-selection-title" className="theme-text">
                    Choose Your Therapeutic Specialist
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelSelection}
                    className="theme-text hover:theme-secondary border-[var(--theme-accent)]"
                    aria-label="Cancel agent selection"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p id="agent-selection-description" className="text-sm theme-text-secondary">
                  Select a specialist that matches your current needs for focused therapeutic support.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <fieldset>
                  <legend className="sr-only">Select a therapeutic specialist</legend>
                  <div className="grid gap-4" role="radiogroup" aria-labelledby="agent-selection-title">
                    {agents.map((agent) => (
                      <button
                        key={agent.type}
                        ref={selectedAgent === agent.type ? selectedAgentCardRef : undefined}
                        type="button"
                        role="radio"
                        aria-checked={selectedAgent === agent.type}
                        aria-describedby={`agent-${agent.type}-description`}
                        className={`w-full text-left cursor-pointer transition-all theme-card border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          selectedAgent === agent.type 
                            ? 'ring-2 ring-[var(--theme-accent)] border-[var(--theme-accent)] bg-blue-50' 
                            : 'border-[var(--theme-surface)] hover:border-[var(--theme-secondary)] hover:bg-gray-50'
                        }`}
                        onClick={() => handleAgentSelection(agent.type)}
                        disabled={sessionLoading}
                      >
                        <div className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-lg ${getAgentColorClass(agent.type)}`}>
                              {getAgentIcon(agent.type)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold theme-text mb-1">
                                {agent.name}
                              </h3>
                              <p id={`agent-${agent.type}-description`} className="text-sm theme-text-secondary mb-3">
                                {agent.description}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {agent.specializations.map((spec) => (
                                  <Badge 
                                    key={spec}
                                    variant="secondary" 
                                    className="text-xs theme-surface theme-text border-[var(--theme-accent)]"
                                  >
                                    {spec.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {selectedAgent === agent.type && (
                              <CheckCircle className="w-6 h-6 text-[var(--theme-accent)]" aria-hidden="true" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {selectedAgent && (
                  <div className="space-y-4 pt-4 border-t border-[var(--theme-accent)]/30">
                    <div>
                      <label htmlFor="session-objective" className="block text-sm font-medium theme-text mb-2">
                        What would you like to work on?
                      </label>
                      <textarea
                        id="session-objective"
                        ref={objectiveInputRef}
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder="Describe what you'd like to focus on in this session..."
                        className="w-full p-3 border border-silver hover:border-2 hover:animate-shimmer rounded-lg resize-none h-20 theme-surface theme-text placeholder:theme-text-secondary focus:outline-none focus:ring-2 focus:ring-[var(--theme-secondary)]"
                        disabled={sessionLoading}
                        aria-describedby="objective-help"
                      />
                      <p id="objective-help" className="text-xs theme-text-secondary mt-1">
                        Be specific about your goals to help the specialist provide targeted support.
                      </p>
                    </div>
                    
                    {sessionLoading && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <Loader2 className="animate-spin h-5 w-5 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-blue-800">Starting your therapeutic session...</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-3">
                      <Button 
                        variant="outline" 
                        onClick={handleBackClick}
                        disabled={sessionLoading}
                        className="theme-text border-[var(--theme-accent)] hover:theme-secondary-light"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={() => startAgentSession(selectedAgent, objective)}
                        disabled={!objective.trim() || sessionLoading}
                        className="theme-primary hover:theme-accent theme-text"
                      >
                        {sessionLoading ? (
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <ArrowRight className="w-4 h-4 mr-2" />
                        )}
                        Start Session
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Available Agents Overview */}
      {!activeSession && !showAgentSelection && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold theme-text">Available Specialists</h3>
          <div className="grid gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="theme-card border-[var(--theme-accent)]">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${getAgentColorClass(agent.type)}`}>
                      {getAgentIcon(agent.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold theme-text mb-1">
                        {agent.name}
                      </h4>
                      <p className="text-sm theme-text-secondary mb-3">
                        {agent.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {agent.specializations.slice(0, 3).map((spec, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-xs theme-surface theme-text border-[var(--theme-accent)]"
                          >
                            {spec.replace('_', ' ')}
                          </Badge>
                        ))}
                        {agent.specializations.length > 3 && (
                          <Badge variant="secondary" className="text-xs theme-surface theme-text border-[var(--theme-accent)]">
                            +{agent.specializations.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      {!activeSession && (
        <Card className="theme-card border-[var(--theme-accent)]">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold theme-text mb-4">How the Agent System Works</h3>
            <div className="space-y-3 text-sm theme-text-secondary">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full theme-primary theme-text flex items-center justify-center text-xs font-bold">1</div>
                <p>The main bot analyzes your messages and suggests connecting with specialists when beneficial</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full theme-primary theme-text flex items-center justify-center text-xs font-bold">2</div>
                <p>Choose a specialist based on your needs (CBT, mindfulness, self-compassion, or anxiety)</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full theme-primary theme-text flex items-center justify-center text-xs font-bold">3</div>
                <p>Work one-on-one with the specialist through focused therapeutic conversations</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full theme-primary theme-text flex items-center justify-center text-xs font-bold">4</div>
                <p>The specialist automatically transfers you back to the main bot when objectives are met</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* End Session Confirmation Dialog */}
      {showEndSessionConfirm && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-session-title"
          aria-describedby="end-session-description"
        >
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle id="end-session-title" className="text-red-800">
                End Therapeutic Session?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p id="end-session-description" className="text-sm text-gray-600">
                Are you sure you want to end your current session with{' '}
                {activeSession && agents.find(a => a.type === activeSession.sessionType)?.name}? 
                Your progress will be saved, but you'll be disconnected from the specialist.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEndSessionConfirm(false)}
                  disabled={sessionLoading}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={endSession}
                  disabled={sessionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {sessionLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  End Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AgentSystem;
