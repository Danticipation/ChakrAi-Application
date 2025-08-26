import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Clock, Star, Play, Pause, Volume2, Waves, TreePine, Wind } from 'lucide-react';
import { MindfulnessExercise } from './MindfulnessExercise';
import DynamicAmbientSound from './DynamicAmbientSound';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface MeditationTemplate {
  id: string;
  name: string;
  description: string;
  type: 'guided' | 'breathing' | 'mindfulness' | 'visualization' | 'body_scan';
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  guidedSteps: Array<{
    step: number;
    instruction: string;
    duration: number;
    audioText: string;
  }>;
  breathingPattern?: {
    inhaleSeconds: number;
    holdSeconds: number;
    exhaleSeconds: number;
    cycles: number;
  };
}

interface MeditationSession {
  id: string;
  meditationType: string;
  duration: number;
  completedDuration: number;
  isCompleted: boolean;
  rating?: number;
  startedAt: string;
  completedAt?: string;
}

const PREDEFINED_MEDITATIONS: MeditationTemplate[] = [
  {
    id: 'beginner-breathing',
    name: 'Beginner Breathing',
    description: 'A gentle introduction to mindful breathing for stress relief and relaxation',
    type: 'breathing',
    duration: 300, // 5 minutes
    difficulty: 'beginner',
    breathingPattern: {
      inhaleSeconds: 4,
      holdSeconds: 2,
      exhaleSeconds: 6,
      cycles: 10
    },
    guidedSteps: [
      {
        step: 1,
        instruction: 'Find a comfortable position and close your eyes',
        duration: 30,
        audioText: 'Welcome to your breathing meditation. Find a comfortable seated or lying position, and gently close your eyes. Let your body relax into this moment.'
      },
      {
        step: 2,
        instruction: 'Begin natural breathing',
        duration: 60,
        audioText: 'Start by breathing naturally, without trying to change anything. Simply notice the rhythm of your breath as it flows in and out.'
      },
      {
        step: 3,
        instruction: 'Count your breaths',
        duration: 120,
        audioText: 'Now we will begin counting our breaths. Inhale for four counts, hold for two, then exhale for six. This helps activate your relaxation response.'
      },
      {
        step: 4,
        instruction: 'Continue rhythmic breathing',
        duration: 60,
        audioText: 'Continue this peaceful rhythm. In for four, hold for two, out for six. Let each exhale release any tension you are holding.'
      },
      {
        step: 5,
        instruction: 'Gentle return',
        duration: 30,
        audioText: 'Slowly return your breathing to its natural rhythm. When you are ready, gently open your eyes and notice how you feel.'
      }
    ]
  },
  {
    id: 'body-scan-relaxation',
    name: 'Body Scan Relaxation',
    description: 'Progressive muscle relaxation and body awareness meditation',
    type: 'body_scan',
    duration: 900, // 15 minutes
    difficulty: 'intermediate',
    guidedSteps: [
      {
        step: 1,
        instruction: 'Settle into relaxation',
        duration: 60,
        audioText: 'Lie down comfortably and close your eyes. Let your entire body settle into a state of complete relaxation.'
      },
      {
        step: 2,
        instruction: 'Focus on your feet',
        duration: 120,
        audioText: 'Bring your attention to your feet. Notice any sensations, tension, or relaxation. Breathe into this area and let your feet completely relax.'
      },
      {
        step: 3,
        instruction: 'Scan your legs',
        duration: 180,
        audioText: 'Move your attention up through your ankles, calves, and thighs. Release any tension you find, letting your legs feel heavy and relaxed.'
      },
      {
        step: 4,
        instruction: 'Relax your torso',
        duration: 180,
        audioText: 'Focus on your lower back, abdomen, chest, and upper back. Breathe deeply and let all the muscles in your torso soften and release.'
      },
      {
        step: 5,
        instruction: 'Release your arms',
        duration: 120,
        audioText: 'Notice your arms from shoulders to fingertips. Let them feel completely loose and heavy, releasing all tension.'
      },
      {
        step: 6,
        instruction: 'Relax your head and face',
        duration: 120,
        audioText: 'Finally, relax your neck, jaw, cheeks, eyes, and forehead. Let your entire face soften into peaceful calm.'
      },
      {
        step: 7,
        instruction: 'Whole body awareness',
        duration: 117,
        audioText: 'Experience your entire body in this state of complete relaxation. Stay here for a moment, feeling peaceful and renewed.'
      }
    ]
  },
  {
    id: 'mindfulness-present-moment',
    name: 'Present Moment Awareness',
    description: 'Mindfulness meditation focusing on present-moment awareness',
    type: 'mindfulness',
    duration: 600, // 10 minutes
    difficulty: 'beginner',
    guidedSteps: [
      {
        step: 1,
        instruction: 'Ground yourself in the present',
        duration: 60,
        audioText: 'Sit comfortably with your eyes closed. Take a moment to arrive fully in this present moment, leaving behind the past and future.'
      },
      {
        step: 2,
        instruction: 'Notice your breath',
        duration: 120,
        audioText: 'Without changing your breath, simply notice it. Feel the air entering and leaving your body, anchoring you in the now.'
      },
      {
        step: 3,
        instruction: 'Observe your thoughts',
        duration: 180,
        audioText: 'Thoughts will come and go like clouds in the sky. Simply observe them without judgment, then gently return to your breath.'
      },
      {
        step: 4,
        instruction: 'Expand your awareness',
        duration: 150,
        audioText: 'Now expand your awareness to include sounds around you, sensations in your body, and the quality of this moment.'
      },
      {
        step: 5,
        instruction: 'Rest in awareness',
        duration: 90,
        audioText: 'Rest in this open, accepting awareness. You are completely present, completely alive in this moment.'
      }
    ]
  },
  {
    id: 'visualization-healing-light',
    name: 'Healing Light Visualization',
    description: 'Guided visualization for healing and inner peace using light imagery',
    type: 'visualization',
    duration: 720, // 12 minutes
    difficulty: 'intermediate',
    guidedSteps: [
      {
        step: 1,
        instruction: 'Enter a state of calm',
        duration: 60,
        audioText: 'Close your eyes and breathe deeply. Allow yourself to enter a state of deep calm and receptivity.'
      },
      {
        step: 2,
        instruction: 'Visualize healing light above',
        duration: 120,
        audioText: 'Imagine a beautiful, warm, golden light above your head. This light represents pure healing energy, love, and peace.'
      },
      {
        step: 3,
        instruction: 'Draw the light into your body',
        duration: 150,
        audioText: 'As you breathe in, draw this healing light down through the top of your head. Feel it flowing into every cell of your being.'
      },
      {
        step: 4,
        instruction: 'Light fills your entire being',
        duration: 180,
        audioText: 'The golden light continues to flow through you, healing any areas of tension, pain, or stress. You are becoming luminous with this healing energy.'
      },
      {
        step: 5,
        instruction: 'Expand the light around you',
        duration: 120,
        audioText: 'Now allow this light to expand beyond your body, creating a protective and healing aura all around you.'
      },
      {
        step: 6,
        instruction: 'Integration and gratitude',
        duration: 90,
        audioText: 'Take a moment to feel grateful for this healing. Know that this light remains with you always. Slowly return your awareness to the room.'
      }
    ]
  }
];

export function GuidedMeditation() {
  const [selectedMeditation, setSelectedMeditation] = useState<MeditationTemplate | null>(null);
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [selectedAmbientSound, setSelectedAmbientSound] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('amy');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  const queryClient = useQueryClient();

  // Fetch user's meditation history
  const { data: sessions } = useQuery({
    queryKey: ['/api/meditation/sessions'],
    enabled: true
  });

  // Save meditation session
  const saveSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      await axios.post('/api/meditation/sessions', sessionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meditation/sessions'] });
    }
  });

  const filteredMeditations = PREDEFINED_MEDITATIONS.filter(meditation => {
    if (filterType !== 'all' && meditation.type !== filterType) return false;
    if (filterDifficulty !== 'all' && meditation.difficulty !== filterDifficulty) return false;
    return true;
  });

  const handleStartMeditation = (meditation: MeditationTemplate) => {
    setSelectedMeditation(meditation);
    setIsExerciseActive(true);
  };

  const handleMeditationComplete = async () => {
    if (selectedMeditation) {
      await saveSessionMutation.mutateAsync({
        meditationType: selectedMeditation.type,
        duration: selectedMeditation.duration,
        completedDuration: selectedMeditation.duration,
        isCompleted: true,
        ambientSound: selectedAmbientSound,
        voiceEnabled,
        selectedVoice
      });
    }
    setIsExerciseActive(false);
    setSelectedMeditation(null);
  };

  const handleMeditationClose = () => {
    setIsExerciseActive(false);
    setSelectedMeditation(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'breathing': return <Wind className="w-4 h-4" />;
      case 'mindfulness': return <Brain className="w-4 h-4" />;
      case 'visualization': return <Star className="w-4 h-4" />;
      case 'body_scan': return <Waves className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  if (isExerciseActive && selectedMeditation) {
    return (
      <>
        <MindfulnessExercise
          exercise={{
            id: selectedMeditation.id,
            name: selectedMeditation.name,
            description: selectedMeditation.description,
            duration: selectedMeditation.duration,
            type: selectedMeditation.type === 'guided' || selectedMeditation.type === 'body_scan' ? 'mindfulness' : selectedMeditation.type,
            guidedSteps: selectedMeditation.guidedSteps,
            ...(selectedMeditation.breathingPattern && { breathingPattern: selectedMeditation.breathingPattern })
          }}
          onComplete={handleMeditationComplete}
          onClose={handleMeditationClose}
          voiceEnabled={voiceEnabled}
          selectedVoice={selectedVoice}
        />
        {selectedAmbientSound && (
          <DynamicAmbientSound
            adaptiveMode={true}
          />
        )}
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold theme-text font-serif">
          🧘 Guided Meditation
        </h1>
        <p className="theme-text-secondary text-lg max-w-2xl mx-auto">
          Find inner peace and balance through our collection of guided meditation practices
        </p>
      </div>

      {/* Settings Panel */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Meditation Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Voice Guide</label>
            <Select value={voiceEnabled ? 'enabled' : 'disabled'} onValueChange={(value) => setVoiceEnabled(value === 'enabled')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Voice Guided</SelectItem>
                <SelectItem value="disabled">Silent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Voice Type</label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={!voiceEnabled}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amy">Amy (Calm)</SelectItem>
                <SelectItem value="james">James (Warm)</SelectItem>
                <SelectItem value="brian">Brian (Deep)</SelectItem>
                <SelectItem value="alexandra">Alexandra (Gentle)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Background Sound</label>
            <Select value={selectedAmbientSound || 'none'} onValueChange={(value) => setSelectedAmbientSound(value === 'none' ? null : value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="ocean-waves">Ocean Waves</SelectItem>
                <SelectItem value="rain-forest">Forest Rain</SelectItem>
                <SelectItem value="wind-chimes">Wind Chimes</SelectItem>
                <SelectItem value="water-drops">Water Drops</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="breathing">Breathing</SelectItem>
            <SelectItem value="mindfulness">Mindfulness</SelectItem>
            <SelectItem value="visualization">Visualization</SelectItem>
            <SelectItem value="body_scan">Body Scan</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Meditation Library */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMeditations.map((meditation) => (
          <Card key={meditation.id} className="hover:shadow-lg transition-shadow duration-300 border-2 border-blue-100 hover:border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(meditation.type)}
                  <CardTitle className="text-lg">{meditation.name}</CardTitle>
                </div>
                <Badge className={getDifficultyColor(meditation.difficulty)}>
                  {meditation.difficulty}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {meditation.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(meditation.duration)}
                </div>
                <span className="capitalize">{meditation.type.replace('_', ' ')}</span>
              </div>

              {meditation.breathingPattern && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-800 mb-1">Breathing Pattern</p>
                  <p className="text-xs text-blue-600">
                    {meditation.breathingPattern.inhaleSeconds}-{meditation.breathingPattern.holdSeconds}-{meditation.breathingPattern.exhaleSeconds} (x{meditation.breathingPattern.cycles})
                  </p>
                </div>
              )}
              
              <Button 
                onClick={() => handleStartMeditation(meditation)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Meditation
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMeditations.length === 0 && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">No meditations match your current filters</p>
        </div>
      )}
    </div>
  );
}