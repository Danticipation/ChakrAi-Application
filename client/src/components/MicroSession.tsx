import { useState, useEffect, useRef } from 'react';
import { Mic, Play, Square, Clock, Send } from 'lucide-react';

interface MicroSessionProps {
  isOpen: boolean;
  onClose: () => void;
  sessionType?: 'journal' | 'mood' | 'gratitude';
  onComplete?: (data: any) => void;
}

export default function MicroSession({ 
  isOpen, 
  onClose, 
  sessionType = 'journal',
  onComplete 
}: MicroSessionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(30);
      setTranscription('');
      setAudioBlob(null);
      setSessionStarted(false);
      setIsRecording(false);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isOpen]);

  const getSessionPrompt = () => {
    switch (sessionType) {
      case 'journal':
        return "Share what's on your mind right now. What thoughts or feelings would you like to express today?";
      case 'mood':
        return "How are you feeling right now? Describe your current emotional state and what might be influencing it.";
      case 'gratitude':
        return "What are you grateful for today? Share something that brought you joy or made you feel thankful.";
      default:
        return "Take 30 seconds to share whatever is on your mind.";
    }
  };

  const getSessionTitle = () => {
    switch (sessionType) {
      case 'journal':
        return 'ðŸŽ™ï¸ Voice Journal Micro-Session';
      case 'mood':
        return 'ðŸ’™ Quick Mood Check-In';
      case 'gratitude':
        return 'ðŸŒŸ Gratitude Moment';
      default:
        return 'ðŸŽ™ï¸ Quick Voice Session';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // CRITICAL FIX: Use MP4/WAV for better OpenAI Whisper compatibility
      let mimeType = 'audio/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/wav';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          throw new Error('Browser does not support MP4 or WAV recording. WebM causes transcription failures.');
        }
      }
      
      console.log('ðŸŽµ MicroSession using audio format:', mimeType);
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setSessionStarted(true);
      startTimer();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;
    
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'micro-session.webm');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setTranscription(data.text || 'Unable to transcribe audio');
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscription('Transcription service temporarily unavailable');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveSession = async () => {
    const sessionData = {
      type: sessionType,
      duration: 30 - timeLeft,
      transcription,
      timestamp: new Date().toISOString(),
      audioSize: audioBlob?.size || 0
    };
    
    try {
      // Save micro-session to journal or mood tracking
      if (sessionType === 'journal') {
        await fetch('/api/journal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: transcription,
            title: `Micro-session: ${new Date().toLocaleDateString()}`,
            tags: ['micro-session', 'voice'],
            isPrivate: true
          })
        });
      } else if (sessionType === 'mood') {
        // Extract mood from transcription or ask user
        await fetch('/api/mood', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mood: 'neutral', // Could be analyzed from transcription
            notes: transcription,
            intensity: 5,
            tags: ['micro-session']
          })
        });
      }
      
      onComplete?.(sessionData);
      onClose();
    } catch (error) {
      console.error('Error saving micro-session:', error);
    }
  };

  const formatTime = (seconds: number) => {
    return `0:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#0a0e1a] to-[#1a237e] rounded-3xl p-6 w-full max-w-md border border-white/10">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            {getSessionTitle()}
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            {getSessionPrompt()}
          </p>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-[#3f51b5] mb-3">
            <span className="text-2xl font-bold text-white">
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-white/60">
            <Clock className="w-4 h-4" />
            <span className="text-sm">30-second session</span>
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          {!sessionStarted ? (
            <button
              onClick={startRecording}
              className="theme-card hover:theme-primary text-white p-4 rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Mic className="w-6 h-6" />
            </button>
          ) : (
            <>
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-all duration-200 animate-pulse"
                >
                  <Square className="w-6 h-6" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="theme-card hover:theme-primary text-white p-4 rounded-full transition-all duration-200"
                >
                  <Mic className="w-6 h-6" />
                </button>
              )}
              
              {audioBlob && (
                <button
                  onClick={playRecording}
                  className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-all duration-200"
                >
                  <Play className="w-6 h-6" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="text-center mb-4">
            <div className="flex items-center justify-center space-x-2 text-red-400">
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Recording...</span>
            </div>
          </div>
        )}

        {/* Audio Processing */}
        {audioBlob && !transcription && !isProcessing && (
          <div className="mb-4">
            <button
              onClick={transcribeAudio}
              className="w-full theme-card/20 hover:theme-card/30 text-white py-3 px-4 rounded-xl border border-[#3f51b5]/30 transition-colors"
            >
              Convert to Text
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="text-center mb-4">
            <div className="text-white/60 text-sm">Processing audio...</div>
            <div className="w-full theme-card/20 rounded-full h-2 mt-2">
              <div className="theme-card h-2 rounded-full animate-pulse w-1/2"></div>
            </div>
          </div>
        )}

        {/* Transcription Display */}
        {transcription && (
          <div className="mb-4">
            <div className="theme-card/20 rounded-xl p-4 border border-[#3f51b5]/30">
              <h4 className="text-white font-medium text-sm mb-2">Your Session:</h4>
              <p className="text-white/90 text-sm leading-relaxed">{transcription}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl transition-colors"
          >
            Cancel
          </button>
          
          {transcription && (
            <button
              onClick={saveSession}
              className="flex-1 theme-card hover:theme-primary text-white py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Save Session</span>
            </button>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-4 text-center">
          <p className="text-white/50 text-xs">
            Speak naturally. Your session will auto-save when complete.
          </p>
        </div>
      </div>
    </div>
  );
}
