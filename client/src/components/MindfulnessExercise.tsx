import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Pause, Play, Square, Volume2, VolumeX } from 'lucide-react';

interface MindfulnessExercise {
  id: string;
  name: string;
  description: string;
  duration: number;
  type: 'breathing' | 'mindfulness' | 'grounding' | 'visualization';
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

interface MindfulnessExerciseProps {
  exercise: MindfulnessExercise;
  onComplete: () => void;
  onClose: () => void;
  voiceEnabled?: boolean;
  selectedVoice?: string;
}

export function MindfulnessExercise({
  exercise,
  onComplete,
  onClose,
  voiceEnabled = true,
  selectedVoice = 'james'
}: MindfulnessExerciseProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(voiceEnabled);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<number | null>(null);

  // Calculate total exercise time
  useEffect(() => {
    const total = exercise.guidedSteps.reduce((sum, step) => sum + step.duration, 0);
    setTotalTime(total);
    setTimeRemaining(total);
  }, [exercise]);

  // Timer management
  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, timeRemaining]);

  // Step progression
  useEffect(() => {
    if (!isActive) return;

    const elapsed = totalTime - timeRemaining;
    let cumulativeTime = 0;
    let newStep = 0;

    for (let i = 0; i < exercise.guidedSteps.length; i++) {
      cumulativeTime += exercise.guidedSteps[i].duration;
      if (elapsed < cumulativeTime) {
        newStep = i;
        break;
      }
    }

    if (newStep !== currentStep) {
      setCurrentStep(newStep);
      if (audioEnabled) {
        playStepAudio(newStep);
      }
    }
  }, [timeRemaining, totalTime, isActive, currentStep, audioEnabled]);

  const playStepAudio = async (stepIndex: number) => {
    if (!audioEnabled || stepIndex >= exercise.guidedSteps.length) return;

    try {
      const step = exercise.guidedSteps[stepIndex];
      const response = await fetch('/api/voice/emotional-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: step.audioText,
          voice: selectedVoice,
          emotionalContext: 'calming',
          intensity: 0.8
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error playing step audio:', error);
    }
  };

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
    if (audioEnabled) {
      playStepAudio(0);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
    setCurrentStep(0);
    setTimeRemaining(totalTime);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleComplete = () => {
    setIsActive(false);
    onComplete();
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
  const currentStepData = exercise.guidedSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gradient-to-b from-blue-50 to-purple-50 border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
            {exercise.name}
          </CardTitle>
          <p className="text-gray-600 text-sm leading-relaxed">
            {exercise.description}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{formatTime(timeRemaining)} remaining</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step */}
          {isActive && currentStepData && (
            <div className="bg-white/60 rounded-xl p-4 border border-purple-100">
              <h3 className="font-semibold text-gray-800 mb-2">
                Step {currentStep + 1}: {currentStepData.instruction}
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {currentStepData.audioText}
              </p>
            </div>
          )}

          {/* Breathing Pattern Indicator */}
          {exercise.breathingPattern && isActive && (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto rounded-full border-4 border-blue-200 flex items-center justify-center bg-blue-50">
                <div className="text-blue-600 font-bold">
                  {exercise.breathingPattern.inhaleSeconds}-{exercise.breathingPattern.holdSeconds}-{exercise.breathingPattern.exhaleSeconds}-{exercise.breathingPattern.holdSeconds}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">Breathing Pattern</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {!isActive ? (
              <Button
                onClick={handleStart}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Exercise
              </Button>
            ) : (
              <>
                <Button
                  onClick={handlePause}
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={handleStop}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </>
            )}

            <Button
              onClick={toggleAudio}
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>

          {/* Close Button */}
          <div className="flex justify-center">
            <Button
              onClick={onClose}
              variant="outline"
              className="text-gray-500 hover:text-gray-700"
            >
              Close Exercise
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hidden audio element for voice playback */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}