import React, { useState, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Settings, Volume2, VolumeX, 
  Clock, TreePine, Waves, Sun, Moon, 
  Heart, Brain, CheckCircle, SkipForward
} from 'lucide-react';
import useErrorHandler from '@/hooks/useErrorHandler';

interface MeditationSession {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  type: 'guided' | 'breathing' | 'mindfulness' | 'visualization';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  backgroundSound: string;
  color: string;
  icon: React.ComponentType<any>;
}

const BeautifulMeditation: React.FC = () => {
  const { handleAsyncError, reportError } = useErrorHandler();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSession, setSelectedSession] = useState<MeditationSession | null>(null);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [meditationAudioUrl, setMeditationAudioUrl] = useState<string | null>(null); // State to hold the blob URL
  // Create audio element ref with proper initialization
  const meditationAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Ensure audio element is properly created
  React.useEffect(() => {
    if (!meditationAudioRef.current) {
      const audio = new Audio();
      audio.id = 'meditation-audio';
      audio.preload = 'metadata';
      meditationAudioRef.current = audio;

    }
  }, []);
  const [ambientAudioElement, setAmbientAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [meditationScript, setMeditationScript] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<'natasha' | 'natasha_husband'>('natasha');
  const [meditationTimer, setMeditationTimer] = useState<NodeJS.Timeout | null>(null);

  const meditationSessions: MeditationSession[] = [
    {
      id: 'morning-mindfulness',
      name: 'Morning Mindfulness',
      description: 'Start your day with clarity and intention',
      duration: 10,
      type: 'mindfulness',
      difficulty: 'beginner',
      backgroundSound: 'birds',
      color: 'from-orange-400 to-yellow-500',
      icon: Sun
    },
    {
      id: 'stress-relief',
      name: 'Stress Relief',
      description: 'Release tension and find calm',
      duration: 15,
      type: 'breathing',
      difficulty: 'beginner',
      backgroundSound: 'ocean',
      color: 'from-blue-400 to-cyan-500',
      icon: Waves
    },
    {
      id: 'deep-focus',
      name: 'Deep Focus',
      description: 'Enhance concentration and mental clarity',
      duration: 20,
      type: 'guided',
      difficulty: 'intermediate',
      backgroundSound: 'forest',
      color: 'from-green-400 to-emerald-500',
      icon: TreePine
    },
    {
      id: 'evening-unwind',
      name: 'Evening Unwind',
      description: 'Prepare for restful sleep',
      duration: 12,
      type: 'visualization',
      difficulty: 'beginner',
      backgroundSound: 'rain',
      color: 'from-purple-400 to-indigo-500',
      icon: Moon
    },
    {
      id: 'loving-kindness',
      name: 'Loving Kindness',
      description: 'Cultivate compassion and self-love',
      duration: 18,
      type: 'guided',
      difficulty: 'intermediate',
      backgroundSound: 'soft_music',
      color: 'from-pink-400 to-rose-500',
      icon: Heart
    },
    {
      id: 'body-scan',
      name: 'Body Scan',
      description: 'Connect with your physical sensations',
      duration: 25,
      type: 'mindfulness',
      difficulty: 'advanced',
      backgroundSound: 'nature',
      color: 'from-teal-400 to-blue-500',
      icon: Brain
    }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start ambient sound playback
  const startAmbientSound = async (session: MeditationSession) => {
    try {

      
      // Stop any existing ambient audio
      if (ambientAudioElement) {
        ambientAudioElement.pause();
        ambientAudioElement.src = '';
      }
      
      // Create new ambient audio element
      const ambientAudio = new Audio(`/api/ambient-sounds/${session.backgroundSound}`);
      ambientAudio.loop = true; // Loop ambient sounds
      ambientAudio.volume = 0.3 * (volume / 100) * (isMuted ? 0 : 1); // Lower volume for background
      
      // Add tracked event listeners for ambient audio
      addTrackedEventListener(ambientAudio, 'canplaythrough', () => {
        // Ambient sound ready
      });
      
      addTrackedEventListener(ambientAudio, 'error', (e: Event) => {
        reportError(new Error('Ambient sound playback failed'), 'Ambient audio error');
      });
      
      addTrackedEventListener(ambientAudio, 'ended', () => {
        // Handle ambient sound ending (though it should loop)
      });
      
      setAmbientAudioElement(ambientAudio);
      
      try {
        await ambientAudio.play();
      } catch (playError) {

      }
      
    } catch (error) {

    }
  };

  // Enhanced ambient sound cleanup
  const stopAmbientSound = () => {
    if (ambientAudioElement) {
      try {
        ambientAudioElement.pause();
        ambientAudioElement.currentTime = 0;
        
        // Remove event listeners if they exist
        const listeners = audioManagerRef.current.eventListeners.get(ambientAudioElement);
        if (listeners) {
          listeners.forEach(({ event, handler }) => {
            ambientAudioElement.removeEventListener(event, handler as EventListener);
          });
          audioManagerRef.current.eventListeners.delete(ambientAudioElement);
        }
        
        if (ambientAudioElement.src) {
          ambientAudioElement.src = '';
          ambientAudioElement.load(); // Force resource cleanup
        }
        
        setAmbientAudioElement(null);
      } catch (error) {
        reportError(new Error('Failed to stop ambient sound'), 'Ambient audio cleanup');
        setAmbientAudioElement(null);
      }
    }
  };
  const generateMeditationScript = (session: MeditationSession): string => {
    const scripts = {
      mindfulness: `Welcome to your ${session.duration} minute ${session.name} meditation.

Find a comfortable position. Either sitting. Or lying down.

Close your eyes gently.

Take a deep breath in through your nose....... and slowly....... exhale through your mouth.........

Feel your body settling into this moment...... Notice the surface beneath you...... supporting your weight completely......

You are safe here....... You are present here.........

Bring your attention to your breath...... Don't try to change it....... just observe......

Notice the cool air entering your nostrils...... the gentle rise of your chest...... the pause at the top...... and the warm air leaving your body.........

Thoughts will come....... This is natural......

When you notice a thought, simply acknowledge it with kindness....... There's a thought....... And gently, without judgment, return your attention to your breath.........

Imagine each thought as a cloud passing through the vast sky of your mind...... Some clouds are dark with worry....... Some are bright with excitement....... All are temporary....... All will pass.........

Your breath is your anchor....... Always here....... Always now......

Breathe in calm..................... breathe out tension.....................

Breathe in peace..................... breathe out stress.....................

Scan your body slowly...... Notice your feet....... Are they relaxed?....... Your legs....... Your belly....... Your chest......

Your shoulders....... often holding so much tension....... Let them drop......

Your jaw....... Your face....... Allow everything to soften.........

Continue breathing naturally........... If your mind wanders to the past, gently bring it back....... If it races to the future, gently bring it back......

This moment is all that exists right now..................

You are exactly where you need to be....... You are doing perfectly....... There is nowhere else to go....... nothing else to do......

Just be here....... breathing....... present....... alive..................

For the next few minutes, rest in this awareness........... Rest in the simple beauty of being........... Your breath will guide you....... Your body will support you....... You are safe..........................................

When you're ready to return........... begin to deepen your breath........... Wiggle your fingers and toes........... Gently open your eyes......

Carry this peace with you into your day....... Namaste.`,
      
      breathing: `Welcome to your ${session.duration} minute breathing meditation.

Settle into a comfortable position...... Place one hand on your chest....... and one hand on your belly......

This is your breathing practice....... your pathway to calm.........

Close your eyes......... Take a moment to notice your natural breath........... No judgment....... Just awareness..................

Now, we'll begin a gentle breathing pattern......

Breathe in slowly through your nose for a count of four......

One............... two............... three............... four...........

Feel your belly rise like a balloon filling with air.........

Hold that breath gently for four counts......

One............... two............... three............... four...........

Notice the fullness....... The pause....... The stillness.........

Now exhale slowly through your mouth for six counts......

One............... two............... three............... four............... five............... six...........

Feel your belly fall....... Feel tension releasing....... Feel stress leaving your body..................

And again....... Breathe in for four......

One............... two............... three............... four...........

Your belly rises....... You are drawing in fresh energy....... fresh life....... fresh possibility.........

Hold for four......

One............... two............... three............... four...........

You are creating space....... Space for healing....... Space for peace.........

Exhale for six......

One............... two............... three............... four............... five............... six...........

Releasing all that no longer serves you....... Worry....... Fear....... Doubt....... All flowing out with your breath..................

This is your rhythm....... Your anchor....... Your safe harbor in any storm.........

Whenever life feels overwhelming....... return to this breath..................

Inhale calm..................... hold peace..................... exhale stress.....................

Again and again........... Each breath is a new beginning....... Each exhale a release....... Each cycle a chance to start fresh..................

Your breath is always with you....... Always available....... Always healing......

Continue this pattern....... Four in..................... Four hold..................... Six out...................................

Notice how your body begins to relax....... Your shoulders drop....... Your jaw unclenches....... Your mind quiets......

This is your body's natural response to conscious breathing..................

You are creating calm from within....... You are your own healer....... You are your own sanctuary......

Continue breathing with this gentle rhythm.........................................

When you're ready........... allow your breath to return to its natural pace........... Take a moment to notice how you feel........... Wiggle your fingers and toes......... Slowly open your eyes......

Remember....... this peace is always available to you....... just one breath away.`,
      
      guided: `Welcome to your ${session.duration} minute meditation journey.

Close your eyes and take three deep, cleansing breaths..................

With each exhale, release a little more tension........... A little more stress........... A little more worry..................

Now, I invite you to imagine yourself in a beautiful, peaceful place.........

This might be a serene forest....... with tall trees reaching toward the sky....... Or a quiet beach....... with gentle waves lapping at the shore....... Or perhaps a comfortable room....... filled with soft, golden light..................

Whatever place appears in your mind's eye....... know that you are completely safe here....... This is your sanctuary....... Your healing space....... Your place of peace..................

Look around this place........... Notice the details....... What colors do you see?........... What sounds do you hear?........... Can you feel the temperature?....... The texture of the ground beneath you?..................

In this sacred space....... imagine a warm, loving presence approaching you........... This might be a wise teacher....... a loving friend....... or simply a feeling of unconditional love.........

This presence radiates compassion....... Acceptance....... Kindness..................

This loving presence speaks to you....... You are exactly as you should be....... You are enough....... You have always been enough....... You are worthy of love....... of joy....... of peace..................

Feel these words washing over you like warm sunlight........... Let them sink deep into your heart....... Into your very cells......

You are worthy....... You are loved....... You are enough..................

Notice how your body responds to this message........... Perhaps your chest opens....... Your breathing deepens....... Your face softens into a gentle smile..................

This loving presence now places a hand over your heart........... Feel a warm, golden light flowing from this hand into your chest.........

This light is pure healing energy....... Pure love....... Pure compassion..................

Watch as this golden light spreads through your entire body........... Down your arms to your fingertips........... Down your legs to your toes........... Up through your neck and head.........

Every cell bathed in this healing light..................

Any pain....... any worry....... any fear....... the light dissolves it........... Transforms it....... Heals it......

You are being filled with love from the inside out..................

Rest here in this golden light........... In this peaceful place........... In this state of pure being...........

You are safe....... You are loved....... You are whole.........................................

Continue to breathe....... allowing each breath to deepen your relaxation........... Deepen your peace........... Deepen your connection to this loving presence that lives within you..............................

Know that you can return to this place anytime....... This sanctuary is always here....... always available....... always welcoming you home..................

When you're ready to return....... take a deep breath........... Begin to wiggle your fingers and toes........... Gently open your eyes......

Carry this light....... this love....... this peace with you into your day.`,
      
      visualization: `Begin your ${session.duration} minute meditation.

Close your eyes and breathe naturally........... Allow your body to settle....... Allow your mind to quiet......

You are entering a space of deep healing and transformation..................

Visualize a warm, golden light hovering above your head........... This light represents peace....... love....... healing....... and infinite wisdom......

It is the light of your highest self....... The light of pure consciousness..................

Watch as this golden light begins to descend........... Slowly....... Gently....... Like honey dripping from a spoon......

It enters through the crown of your head..................

Feel the warmth as it flows into your scalp....... Your forehead relaxes....... Your eyes soften....... Your jaw releases......

The light is dissolving tension you didn't even know you were holding..................

The golden light flows down into your neck and shoulders........... This area that carries so much of our stress......

Feel the warmth....... Feel the release....... Your shoulders drop....... Your neck lengthens......

You are being held by this healing energy..................

The light continues down through your chest....... Into your heart center.........

Your heart begins to glow with golden light........... This is your emotional center....... The place where you hold joy and sorrow....... love and pain......

The golden light is healing it all..................

With each breath, your heart glows brighter........... Stronger....... Healthier......

You are healing from the inside out........... Old wounds are being bathed in light........... Old pains are being transformed....... You are becoming whole..................

The golden light flows down through your belly....... Your solar plexus....... Your center of personal power......

Feel yourself growing stronger....... More confident....... More aligned with your truth..................

Down through your hips....... Your legs....... Your knees....... Your ankles....... Your feet......

Every cell of your body is now filled with this beautiful, healing, golden light..............................

You are radiant....... You are luminous....... You are a being of pure light......

Take a moment to simply rest in this experience..................

This is your true nature....... This is who you really are beneath all the stress and worry..............................

This golden light is now extending beyond your body........... Creating a protective cocoon around you........... An aura of peace and love......

Nothing that is not aligned with your highest good can penetrate this light..................

You are safe....... You are protected....... You are loved....... You are whole....... You are healed....... You are exactly where you need to be.........................................

Continue to breathe........... Continue to glow........... Continue to heal..................

When you're ready....... slowly bring your awareness back to the room........... Wiggle your fingers and toes......

Know that this golden light remains with you....... It is always a part of you....... You can access it anytime you need healing....... peace....... or strength......

Gently open your eyes....... Namaste.`
    };
    return scripts[session.type] || scripts.mindfulness;
  };

  // Clean silent meditation
  const startSilentMeditation = (session: MeditationSession) => {

    setIsLoadingAudio(false);
    setIsPlaying(true); // Set playing to true for silent meditation
    startMeditationTimer(session);
  };

  // Enhanced audio management system
  const audioManagerRef = useRef<{
    currentAudioElement: HTMLAudioElement | null;
    audioUrls: Set<string>;
    eventListeners: Map<HTMLAudioElement, Array<{event: string, handler: Function}>>;
    audioContext: AudioContext | null;
  }>({
    currentAudioElement: null,
    audioUrls: new Set(),
    eventListeners: new Map(),
    audioContext: null,
  });

  // Comprehensive audio cleanup function
  const cleanupAudio = () => {
    const manager = audioManagerRef.current;
    
    // 1. Stop and cleanup current audio element
    if (manager.currentAudioElement) {
      try {
        manager.currentAudioElement.pause();
        manager.currentAudioElement.currentTime = 0;
        
        // Remove all tracked event listeners
        const listeners = manager.eventListeners.get(manager.currentAudioElement);
        if (listeners) {
          listeners.forEach(({ event, handler }) => {
            manager.currentAudioElement?.removeEventListener(event, handler as EventListener);
          });
          manager.eventListeners.delete(manager.currentAudioElement);
        }
        
        // Clear source and load to free resources
        if (manager.currentAudioElement.src) {
          manager.currentAudioElement.src = '';
          manager.currentAudioElement.load(); // Force unload
        }
        
        manager.currentAudioElement = null;
      } catch (error) {
        reportError(new Error('Failed to cleanup audio element'), 'Audio cleanup');
      }
    }
    
    // 2. Revoke all blob URLs to prevent memory leaks
    manager.audioUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        // Silently handle URL revocation errors
      }
    });
    manager.audioUrls.clear();
    
    // 3. Close audio context if exists
    if (manager.audioContext && manager.audioContext.state !== 'closed') {
      try {
        manager.audioContext.close();
        manager.audioContext = null;
      } catch (error) {
        // Silently handle audio context cleanup errors
      }
    }
    
    // 4. Clear meditation audio ref
    if (meditationAudioRef.current) {
      try {
        meditationAudioRef.current.pause();
        meditationAudioRef.current.currentTime = 0;
        if (meditationAudioRef.current.src) {
          meditationAudioRef.current.src = '';
          meditationAudioRef.current.load();
        }
      } catch (error) {
        // Silently handle ref cleanup errors
      }
    }
  };
  
  // Helper function to add tracked event listeners
  const addTrackedEventListener = (audio: HTMLAudioElement, event: string, handler: Function) => {
    const manager = audioManagerRef.current;
    
    if (!manager.eventListeners.has(audio)) {
      manager.eventListeners.set(audio, []);
    }
    
    const listeners = manager.eventListeners.get(audio)!;
    listeners.push({ event, handler });
    
    audio.addEventListener(event, handler as EventListener);
  };
  
  // Helper function to create and track audio URLs
  const createTrackedAudioUrl = (blob: Blob): string => {
    const url = URL.createObjectURL(blob);
    audioManagerRef.current.audioUrls.add(url);
    return url;
  };
  
  // Simplified audio handling function
  const playMeditationAudio = async (session: MeditationSession) => {
    try {
      setIsLoadingAudio(true);
      
      const script = generateMeditationScript(session);
      setMeditationScript(script);

      // Stop any existing audio
      cleanupAudio();
      if (meditationAudioRef.current) {
        meditationAudioRef.current.pause();
        meditationAudioRef.current.src = '';
      }

      // Get authentication token
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: script,
          voice: selectedVoice,
          stability: 0.3,        // Lower for more variation
          similarity_boost: 0.5,  // Lower for more natural
          style: 0.0,            // No extra style
          use_speaker_boost: true // Better quality
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();

        if (audioBlob.size === 0) {
          throw new Error('Received empty audio blob for meditation');
        }

        // Create and track audio URL
        const audioUrl = createTrackedAudioUrl(audioBlob);
        
        // Create audio element with enhanced management
        const newAudioElement = new Audio();
        newAudioElement.src = audioUrl;
        newAudioElement.volume = (volume / 100) * (isMuted ? 0 : 1);
        newAudioElement.preload = 'auto';
        
        // Store reference for cleanup
        audioManagerRef.current.currentAudioElement = newAudioElement;
        
        // Set up tracked event listeners
        addTrackedEventListener(newAudioElement, 'canplay', async () => {
          await handleAsyncError(async () => {
            if (!audioManagerRef.current.currentAudioElement) return;
            
            // Ensure audio context is active and tracked
            if (typeof AudioContext !== 'undefined') {
              if (!audioManagerRef.current.audioContext) {
                audioManagerRef.current.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              }
              
              if (audioManagerRef.current.audioContext.state === 'suspended') {
                await audioManagerRef.current.audioContext.resume();
              }
            }

            await audioManagerRef.current.currentAudioElement.play();
            setIsPlaying(true);
            setIsLoadingAudio(false);
            startMeditationTimer(session);
          }, 'Playing meditation audio')?.catch(() => {
            setIsPlaying(false);
            setIsLoadingAudio(false);
            startSilentMeditation(session);
          });
        });

        addTrackedEventListener(newAudioElement, 'error', (e: Event) => {
          reportError(new Error('Meditation audio playback failed'), 'Meditation audio error');
          setIsPlaying(false);
          setIsLoadingAudio(false);
          startSilentMeditation(session);
        });
        
        addTrackedEventListener(newAudioElement, 'ended', () => {
          setIsPlaying(false);
          // Audio finished naturally
        });
        
        addTrackedEventListener(newAudioElement, 'loadstart', () => {
          // Track loading start
        });
        
        addTrackedEventListener(newAudioElement, 'loadeddata', () => {
          // Track when data is loaded
        });

        // Start loading the audio
        newAudioElement.load();

      } else {

        setIsLoadingAudio(false);
        setIsPlaying(false);
        startSilentMeditation(session);
      }
    } catch (error) {

      setIsLoadingAudio(false);
      setIsPlaying(false);
      startSilentMeditation(session);
    }
  };

  // Start independent meditation timer
  const startMeditationTimer = (session: MeditationSession) => {

    setIsPlaying(true);
    setCurrentTime(0);
    
    const timer = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 1;
        if (newTime >= session.duration * 60) {

          setIsPlaying(false);
          clearInterval(timer);
          setMeditationTimer(null);
          // Clean up audio if still playing
          if (meditationAudioRef.current) {
            meditationAudioRef.current.pause();
          }
          return session.duration * 60; // Keep final time displayed
        }
        return newTime;
      });
    }, 1000);
    
    setMeditationTimer(timer);
  };

  // Fallback ambient meditation without voice
  const startAmbientMeditation = (session: MeditationSession) => {

    // Skip ambient sounds for now - just start the timer
    startMeditationTimer(session);
  };

  // Enhanced play/pause with aggressive cleanup
  const togglePlayPause = async () => {
    if (!selectedSession) return;

    if (isPlaying) {
      // AGGRESSIVE STOP EVERYTHING
      setIsPlaying(false);
      
      // Stop meditation timer
      if (meditationTimer) {
        clearInterval(meditationTimer);
        setMeditationTimer(null);
      }
      
      // FORCE STOP speech synthesis with multiple attempts
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Aggressive cleanup
        [50, 100, 200].forEach(delay => {
          setTimeout(() => {
            if (window.speechSynthesis.speaking) {
              window.speechSynthesis.cancel();
            }
          }, delay);
        });
      }
      
      // Comprehensive audio cleanup
      cleanupAudio();
      setMeditationAudioUrl(null);
      
      // Stop ambient audio
      if (ambientAudioElement) {
        try {
          ambientAudioElement.pause();
          ambientAudioElement.currentTime = 0;
        } catch (error) {
          reportError(new Error('Failed to pause ambient audio'), 'Audio pause error');
        }
      }
      
    } else {
      // Start or resume meditation
      if (currentTime === 0 || currentTime >= selectedSession.duration * 60 || !meditationAudioUrl) {
        // Start new session - cleanup first to prevent conflicts
        cleanupAudio();
        await playMeditationAudio(selectedSession);
      } else {
        // Resume existing session
        startMeditationTimer(selectedSession);
        
        // Safely resume audio
        await handleAsyncError(async () => {
          if (audioManagerRef.current.currentAudioElement) {
            await audioManagerRef.current.currentAudioElement.play();
          }
          if (ambientAudioElement) {
            await ambientAudioElement.play();
          }
        }, 'Resuming meditation audio');
      }
    }
  };

  // Enhanced meditation reset with comprehensive cleanup
  const resetMeditation = () => {
    // Stop timer first
    if (meditationTimer) {
      clearInterval(meditationTimer);
      setMeditationTimer(null);
    }
    
    // FORCE STOP speech synthesis with multiple attempts
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Aggressive cleanup with timeouts
      [50, 100, 200].forEach(delay => {
        setTimeout(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
          }
        }, delay);
      });
    }
    
    // Comprehensive audio cleanup
    cleanupAudio();
    
    // Stop ambient audio
    stopAmbientSound();
    
    // Reset all state
    setIsPlaying(false);
    setCurrentTime(0);
    setIsLoadingAudio(false);
    setMeditationAudioUrl(null);
    
    // Force garbage collection hint (if available)
    if (window.gc) {
      try {
        window.gc();
      } catch {
        // Ignore if not available
      }
    }
  };

  // Update audio volume when volume state changes
  React.useEffect(() => {
    if (meditationAudioRef.current) {
      meditationAudioRef.current.volume = (volume / 100) * (isMuted ? 0 : 1);
    }
    if (ambientAudioElement) {
      ambientAudioElement.volume = 0.3 * (volume / 100) * (isMuted ? 0 : 1);
    }
  }, [volume, isMuted, ambientAudioElement]); // Removed audioElement from dependencies

  // Simplified effect for cleanup only
  React.useEffect(() => {
    return () => {
      // Only clean up on component unmount
      if (meditationAudioRef.current && meditationAudioRef.current.src) {
        meditationAudioRef.current.pause();
        meditationAudioRef.current.src = '';
      }
    };
  }, []);

  // Comprehensive cleanup on component unmount
  React.useEffect(() => {
    return () => {
      // Stop timer
      if (meditationTimer) {
        clearInterval(meditationTimer);
      }
      
      // Comprehensive audio cleanup
      cleanupAudio();
      
      // Stop ambient audio
      stopAmbientSound();
      
      // Force stop speech synthesis
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      // Clear all state
      setMeditationAudioUrl(null);
      setIsPlaying(false);
      setIsLoadingAudio(false);
    };
  }, []); // No dependencies - run only on unmount

  const SessionCard = ({ session, isSelected, onClick }: {
    session: MeditationSession;
    isSelected: boolean;
    onClick: () => void;
  }) => {
    const Icon = session.icon;
    
    return (
      <div
        className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
          isSelected 
            ? 'bg-white/25 border-2 border-white/50 shadow-2xl' 
            : 'bg-white/10 border border-white/20 hover:bg-white/15'
        }`}
        onClick={() => {
          onClick();
          
          // Comprehensive cleanup when switching sessions
          if (meditationTimer) {
            clearInterval(meditationTimer);
            setMeditationTimer(null);
          }
          
          // Stop current audio completely
          cleanupAudio();
          stopAmbientSound();
          
          // Reset all state
          setMeditationAudioUrl(null);
          setIsPlaying(false);
          setCurrentTime(0);
          setIsLoadingAudio(false);
          
          // Force stop speech synthesis
          if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
          }
        }}
      >
        {/* Background Gradient */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${session.color} opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${session.color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-white/60" />
              <span className="text-white/80 text-sm">{session.duration} min</span>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2">{session.name}</h3>
          <p className="text-white/70 text-sm mb-4 leading-relaxed">{session.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                session.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
                session.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {session.difficulty}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                {session.type}
              </span>
            </div>
            
            {isSelected && (
              <div className="flex items-center text-green-400">
                <CheckCircle className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🧘 Guided Meditation
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Find inner peace and balance through our collection of guided meditation practices
          </p>
        </div>

        {/* Settings Panel */}
        <div className="mb-8 p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Meditation Settings
            </h2>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-white/60 hover:text-white transition-colors duration-300"
            >
              {showSettings ? 'Hide' : 'Show'} Settings
            </button>
          </div>

          {showSettings && (
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Meditation Voice</label>
                <select 
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value as 'natasha' | 'natasha_husband')}
                >
                  <option value="natasha">Natasha (Female - Calming)</option>
                  <option value="natasha_husband">Natasha's Husband (Male - Deep)</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Voice Type</label>
                <select className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white">
                  <option value="guided">Voice Guided</option>
                  <option value="music">Music Only</option>
                  <option value="silent">Silent</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Background Sound</label>
                <select className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white">
                  <option value="none">None</option>
                  <option value="ocean">Ocean Waves</option>
                  <option value="forest">Forest Sounds</option>
                  <option value="rain">Rain</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Session Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Choose Your Practice</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meditationSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isSelected={selectedSession?.id === session.id}
                onClick={() => setSelectedSession(session)}
              />
            ))}
          </div>
        </div>

        {/* Meditation Player */}
        {selectedSession && (
          <div className="p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="text-center mb-8">
              <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${selectedSession.color} mb-4`}>
                <selectedSession.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{selectedSession.name}</h3>
              <p className="text-white/70">{selectedSession.description}</p>
            </div>

            {/* Progress Circle */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 90}`}
                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - currentTime / (selectedSession.duration * 60))}`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">
                      {formatTime(Math.max(0, selectedSession.duration * 60 - currentTime))}
                    </div>
                    <div className="text-white/60 text-sm">remaining</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-6 mb-6">
              <button
                onClick={resetMeditation}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300"
                title="Reset meditation"
              >
                <RotateCcw className="w-6 h-6 text-white" />
              </button>
              
              <button
                onClick={() => {
                  const newTime = Math.max(0, currentTime - 10);
                  setCurrentTime(newTime);
                  if (meditationAudioRef.current) {
                    meditationAudioRef.current.currentTime = newTime;
                  }
                }}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300"
              >
                <SkipForward className="w-6 h-6 text-white transform rotate-180" />
              </button>

              <button
                onClick={togglePlayPause}
                disabled={isLoadingAudio}
                className={`p-6 rounded-full bg-gradient-to-r ${selectedSession.color} hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${isLoadingAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoadingAudio ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>

              <button
                onClick={() => {
                  const newTime = Math.min(selectedSession.duration * 60, currentTime + 10);
                  setCurrentTime(newTime);
                  if (meditationAudioRef.current) {
                    meditationAudioRef.current.currentTime = newTime;
                  }
                }}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300"
              >
                <SkipForward className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6 text-white" />
                ) : (
                  <Volume2 className="w-6 h-6 text-white" />
                )}
              </button>
            </div>

            {/* Volume Control */}
            {!isMuted && (
              <div className="flex items-center justify-center space-x-4">
                <Volume2 className="w-4 h-4 text-white/60" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-32 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-white/60 text-sm">{volume}%</span>
              </div>
            )}
          </div>
        )}
        {/* Removed conflicting DOM audio element */}
      </div>
    </div>
  );
};

export default BeautifulMeditation;

