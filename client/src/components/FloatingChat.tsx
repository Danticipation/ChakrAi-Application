import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Mic, Square, Volume2, VolumeX, Move, Maximize2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosResponse } from 'axios';

// Utility Functions
const generateDeviceFingerprint = (): string => {
  return `browser_${navigator.userAgent.slice(0, 50)}_${screen.width}x${screen.height}_${new Date().getTimezoneOffset()}_${navigator.language}`;
};

const generateSessionId = (): string => {
  const existingSessionId = sessionStorage.getItem('chakrai_session_id');
  if (existingSessionId) return existingSessionId;

  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  sessionStorage.setItem('chakrai_session_id', newSessionId);
  return newSessionId;
};

const generateUniqueId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

// Types and Interfaces
interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  timestamp: number;
}

interface FloatingChatProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedVoice: string;
}

interface ChatApiResponse {
  success?: boolean;
  message?: string;
  response?: string;
  audio?: string;
  audioUrl?: string;
  error?: string;
  voiceUsed?: string;
  crisisDetected?: boolean;
  personalityMode?: string;
}

interface TranscriptionResponse {
  success: boolean;
  transcription?: string;
  error?: string;
}

interface ChatHistoryResponse {
  success: boolean;
  messages?: Message[];
  error?: string;
}

// Main Component
const FloatingChat: React.FC<FloatingChatProps> = ({ isOpen, onToggle, selectedVoice }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [lastAudioData, setLastAudioData] = useState<string | null>(null);
  
  // Dragging and resizing state
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [size, setSize] = useState({ width: 384, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Refs for persistent values and DOM elements
  const sessionIdRef = useRef<string>(generateSessionId());
  const deviceFingerprintRef = useRef<string>(generateDeviceFingerprint());
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const queryClient = useQueryClient();

  // Utility functions
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const constrainToViewport = useCallback((pos: { x: number; y: number }, dimensions: { width: number; height: number }) => {
    const maxX = window.innerWidth - dimensions.width;
    const maxY = window.innerHeight - dimensions.height;
    return {
      x: Math.max(0, Math.min(maxX, pos.x)),
      y: Math.max(0, Math.min(maxY, pos.y))
    };
  }, []);

  // Window resize handler to keep chat in bounds
  const handleWindowResize = useCallback(() => {
    setPosition(prev => constrainToViewport(prev, size));
  }, [size, constrainToViewport]);

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [handleWindowResize]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Mouse event handlers for dragging with proper bounds checking
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newPos = constrainToViewport({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }, size);
      setPosition(newPos);
    }
    if (isResizing) {
      const newWidth = Math.max(300, Math.min(800, resizeStart.width + (e.clientX - resizeStart.x)));
      const newHeight = Math.max(400, Math.min(700, resizeStart.height + (e.clientY - resizeStart.y)));
      setSize({ width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, dragStart, resizeStart, size, constrainToViewport]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
    e.preventDefault();
    e.stopPropagation();
  }, [size]);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isDragging ? 'grabbing' : 'nw-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // API functions with proper error handling
  const loadChatHistory = useCallback(async (): Promise<void> => {
    try {
      const response: AxiosResponse<ChatHistoryResponse> = await axios.get('/api/chat/history/1?limit=50', {
        headers: {
          'X-Device-Fingerprint': deviceFingerprintRef.current,
          'X-Session-Id': sessionIdRef.current
        }
      });

      if (response.data.success && response.data.messages) {
        const messagesWithIds = response.data.messages.map(msg => ({
          ...msg,
          id: msg.id || generateUniqueId()
        }));
        setMessages(messagesWithIds);
      } else {
        // Only show greeting if no chat history exists
        setMessages([{
          id: generateUniqueId(),
          sender: 'bot',
          text: 'Hello! I\'m Chakrai, How are you feeling today?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Fallback to greeting message
      setMessages([{
        id: generateUniqueId(),
        sender: 'bot',
        text: 'Hello! I\'m Chakrai, How are you feeling today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      }]);
    }
  }, []);

  const sendMessage = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;

    const timestamp = Date.now();
    const userMessage: Message = {
      id: generateUniqueId(),
      sender: 'user',
      text: text.trim(),
      time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('🚀 Sending chat message:', text.trim());
      const response: AxiosResponse<ChatApiResponse> = await axios.post('/api/chat', {
        message: text.trim(),
        context: 'floating_chat'
      }, {
        headers: {
          'X-Device-Fingerprint': deviceFingerprintRef.current,
          'X-Session-Id': sessionIdRef.current
        }
      });
      
      console.log('📥 Chat API response:', response.data);
      console.log('🔍 Chat API response keys:', Object.keys(response.data));
      console.log('🔍 Audio data check - audioUrl exists:', !!response.data.audioUrl);
      console.log('🔍 Audio data check - audioUrl length:', response.data.audioUrl?.length);
      console.log('🔍 Audio data check - audioUrl first 50 chars:', response.data.audioUrl?.substring(0, 50));
      console.log('🔍 Selected voice:', selectedVoice);

      // Check if we have a valid response (success field or message/response field)
      if (response.data.success !== false && (response.data.message || response.data.response)) {
        const botTimestamp = Date.now();
        const botMessage: Message = {
          id: generateUniqueId(),
          sender: 'bot',
          text: response.data.message || response.data.response || 'Sorry, I couldn\'t process that.',
          time: new Date(botTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: botTimestamp
        };

        setMessages(prev => [...prev, botMessage]);
        console.log('✅ Bot message added:', botMessage.text);

        // Auto-play voice response if audio is available
        if (selectedVoice && response.data.audioUrl) {
          console.log('🔊 Playing audio response...');
          setLastAudioData(response.data.audioUrl);
          playBase64Audio(response.data.audioUrl);
        } else if (selectedVoice && (response.data.message || response.data.response)) {
          console.log('🔊 No audio in response, using fallback TTS...');
          setLastAudioData(null);
          playVoiceResponse(response.data.message || response.data.response || '');
        }
      } else {
        console.warn('❌ Invalid response data:', response.data);
        throw new Error(response.data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorTimestamp = Date.now();
      const errorMessage: Message = {
        id: generateUniqueId(),
        sender: 'bot',
        text: 'I apologize, but I\'m having trouble responding right now. Please try again.',
        time: new Date(errorTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: errorTimestamp
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVoice]);

  const playBase64Audio = useCallback(async (base64Audio: string): Promise<void> => {
    if (!base64Audio || isPlayingVoice) return;

    setIsPlayingVoice(true);
    try {
      console.log('🎵 Converting base64 to audio blob...');
      console.log('🎵 Base64 audio length:', base64Audio.length);
      
      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Audio)) {
        throw new Error('Invalid base64 format');
      }
      
      // Convert base64 to binary data
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log('🎵 Created audio URL, size:', audioBlob.size, 'bytes');
      console.log('🎵 Audio URL:', audioUrl);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.volume = 0.8;
      audioRef.current.onended = () => {
        console.log('🎵 Audio playback ended');
        setIsPlayingVoice(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = (e) => {
        console.error('🎵 Audio playback error:', e);
        setIsPlayingVoice(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.oncanplay = () => {
        console.log('🎵 Audio ready to play');
      };
      
      try {
        console.log('🎵 Starting audio playback...');
        await audioRef.current.play();
        console.log('🎵 Audio playback started successfully');
      } catch (playError) {
        console.error('🎵 Autoplay prevented:', playError);
        console.log('🎵 Attempting to handle autoplay restriction...');
        
        // Try to enable audio through user interaction
        document.addEventListener('click', async () => {
          try {
            if (audioRef.current) {
              await audioRef.current.play();
              console.log('🎵 Audio started after user interaction');
            }
          } catch (retryError) {
            console.error('🎵 Failed to play audio even after user interaction:', retryError);
          }
        }, { once: true });
        
        setIsPlayingVoice(false);
        URL.revokeObjectURL(audioUrl);
      }
    } catch (error) {
      console.error('🎵 Error playing base64 audio:', error);
      setIsPlayingVoice(false);
    }
  }, [isPlayingVoice]);

  const playVoiceResponse = useCallback(async (text: string): Promise<void> => {
    if (!selectedVoice || isPlayingVoice) return;

    setIsPlayingVoice(true);
    try {
      const response = await axios.post('/api/text-to-speech', {
        text,
        voice: selectedVoice
      }, { responseType: 'blob' });

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.volume = 0.8;
      audioRef.current.onended = () => {
        setIsPlayingVoice(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        console.error('Audio playback error');
        setIsPlayingVoice(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      try {
        await audioRef.current.play();
      } catch (playError) {
        console.error('Autoplay prevented:', playError);
        setIsPlayingVoice(false);
        URL.revokeObjectURL(audioUrl);
      }
    } catch (error) {
      console.error('Error playing voice:', error);
      setIsPlayingVoice(false);
    }
  }, [selectedVoice, isPlayingVoice]);

  const stopVoice = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingVoice(false);
    }
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      console.log('🎤 =============== MICROPHONE RECORDING DIAGNOSTIC ===============');
      console.log('🔍 Browser info:', navigator.userAgent);
      console.log('🔍 Platform:', navigator.platform);
      console.log('🔍 Language:', navigator.language);
      
      // Enhanced browser compatibility check
      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices API not supported. Please use a modern browser (Chrome, Firefox, Safari, Edge).');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported. Please update your browser.');
      }
      
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder not supported. Please use a different browser.');
      }

      // Test audio format support
      const supportedFormats = [];
      const testFormats = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav',
        'audio/ogg'
      ];
      
      for (const format of testFormats) {
        if (MediaRecorder.isTypeSupported(format)) {
          supportedFormats.push(format);
        }
      }
      
      console.log('📊 Supported audio formats:', supportedFormats);
      
      if (supportedFormats.length === 0) {
        throw new Error('No supported audio formats found. Please try a different browser.');
      }

      // Enhanced audio constraints with fallback options
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 16000, min: 8000, max: 48000 },
          channelCount: { ideal: 1, min: 1, max: 2 },
          latency: 0.1,
          volume: 1.0
        }
      };

      console.log('🔍 Audio constraints:', JSON.stringify(constraints, null, 2));
      console.log('🔍 Requesting microphone permission...');
      
      // Check available devices first
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        console.log('🎤 Available audio input devices:', audioInputs.length);
        audioInputs.forEach((device, index) => {
          console.log(`  ${index + 1}. ${device.label || 'Unnamed Device'} (${device.deviceId})`);
        });
        
        if (audioInputs.length === 0) {
          throw new Error('No microphone devices found. Please connect a microphone and refresh the page.');
        }
      } catch (deviceError) {
        console.warn('⚠️ Could not enumerate devices:', deviceError);
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Microphone permission granted successfully');
      console.log('📊 Stream info:', {
        active: stream.active,
        id: stream.id,
        tracks: stream.getTracks().length
      });
      
      // Analyze audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks found in stream');
      }
      
      audioTracks.forEach((track, index) => {
        console.log(`🎤 Audio track ${index + 1}:`, {
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings(),
          capabilities: track.getCapabilities?.()
        });
      });
      
      streamRef.current = stream;

      // Select best audio format
      let selectedMimeType = supportedFormats[0] || '';
      
      console.log('🎵 Selected audio format:', selectedMimeType);
      
      // Create MediaRecorder with enhanced options
      const recorderOptions = selectedMimeType ? { 
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000 
      } : { 
        audioBitsPerSecond: 128000 
      };
      
      console.log('📊 MediaRecorder options:', recorderOptions);
      
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      console.log('📊 MediaRecorder created successfully');
      console.log('📊 MediaRecorder state:', recorder.state);
      console.log('📊 MediaRecorder mimeType:', recorder.mimeType);
      
      // Audio level monitoring for debugging
      let audioContext: AudioContext | null = null;
      let analyser: AnalyserNode | null = null;
      let monitoringInterval: NodeJS.Timeout | null = null;
      
      try {
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        console.log('🔊 Audio analysis setup complete');
        
        // Monitor audio levels
        monitoringInterval = setInterval(() => {
          if (analyser && isRecording) {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            if (average > 0) {
              console.log('🎤 Audio level detected:', Math.round(average), '/255');
            }
          }
        }, 1000);
      } catch (audioContextError) {
        console.warn('⚠️ Audio monitoring setup failed:', audioContextError);
      }

      recorder.ondataavailable = (event) => {
        console.log('📦 Audio data chunk received:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('📊 Total chunks so far:', audioChunksRef.current.length);
        } else {
          console.warn('⚠️ Received empty audio chunk');
        }
      };
      
      recorder.onstop = async () => {
        console.log('🛑 Recording stopped');
        
        // Clean up audio monitoring
        if (monitoringInterval) {
          clearInterval(monitoringInterval);
        }
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close().catch(console.warn);
        }
        
        // Stop all audio tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            console.log('🔇 Audio track stopped:', track.label);
          });
          streamRef.current = null;
        }
        
        setIsRecording(false);
        
        console.log('📈 Final audio chunks collected:', audioChunksRef.current.length);
        console.log('📊 Chunk sizes:', audioChunksRef.current.map(chunk => chunk.size));
        
        if (audioChunksRef.current.length > 0) {
          const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
          console.log('📊 Total audio data:', totalSize, 'bytes');
          
          if (totalSize === 0) {
            console.error('❌ Audio chunks exist but total size is 0');
            alert('Recording failed: No audio data captured. Please check your microphone settings.');
            return;
          }
          
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: selectedMimeType || 'audio/webm' 
          });
          console.log('🎵 Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type);
          
          if (audioBlob.size === 0) {
            console.error('❌ Audio blob is empty');
            alert('Recording failed: Empty audio file. Please try again.');
            return;
          }
          
          await sendAudioToWhisper(audioBlob);
          audioChunksRef.current = [];
        } else {
          console.warn('⚠️ No audio data recorded - microphone may not be working');
          alert('No audio was captured. Please check:\n1. Microphone is connected\n2. Microphone permissions are granted\n3. Microphone is not muted\n4. Try speaking louder');
        }
      };
      
      recorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        console.error('❌ Error details:', (event as any).error);
        
        // Clean up on error
        if (monitoringInterval) {
          clearInterval(monitoringInterval);
        }
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close().catch(console.warn);
        }
        
        setIsRecording(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        alert('Recording error occurred. Please refresh the page and try again.');
      };

      setIsRecording(true);
      recorder.start(500); // Capture data every 500ms for better responsiveness
      console.log('🎙️ Recording started successfully');
      console.log('🎙️ MediaRecorder state after start:', recorder.state);
      
      // Auto-stop recording after 10 seconds (instead of relying on silence detection)
      const autoStopTimeout = setTimeout(() => {
        if (recorder.state === 'recording') {
          console.log('🕐 Auto-stopping recording after 10 seconds');
          recorder.stop();
        }
      }, 10000);
      
      // Store timeout reference for cleanup
      (recorder as any).autoStopTimeout = autoStopTimeout;
      
      // Test if recording is actually working
      setTimeout(() => {
        if (recorder.state === 'recording') {
          console.log('✅ Recording confirmed active after 2 seconds');
          console.log('💡 Keep speaking - recording will auto-stop in 8 more seconds');
        } else {
          console.error('❌ Recording not active after 2 seconds, state:', recorder.state);
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Could not access microphone. ';
      const err = error as any;
      if (err?.name === 'NotAllowedError') {
        errorMessage += 'Please allow microphone access and try again.';
      } else if (err?.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please check your device.';
      } else if (err?.name === 'NotReadableError') {
        errorMessage += 'Microphone is being used by another application.';
      } else {
        errorMessage += err?.message || 'Unknown error occurred.';
      }
      
      alert(errorMessage);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🛑 Manual stop recording triggered');
      
      // Clear auto-stop timeout
      const autoStopTimeout = (mediaRecorderRef.current as any).autoStopTimeout;
      if (autoStopTimeout) {
        clearTimeout(autoStopTimeout);
      }
      
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const sendAudioToWhisper = useCallback(async (audioBlob: Blob): Promise<void> => {
    try {
      console.log('🚀 Sending audio to Whisper API...');
      console.log('📊 Audio blob size:', audioBlob.size, 'bytes');
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('userId', '1');
      
      const response: AxiosResponse<TranscriptionResponse> = await axios.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Device-Fingerprint': deviceFingerprintRef.current,
          'X-Session-Id': sessionIdRef.current
        }
      });
      
      console.log('📥 Transcription response:', response.data);
      
      if (response.data.success && response.data.transcription) {
        console.log('✅ Transcription successful:', response.data.transcription);
        await sendMessage(response.data.transcription);
      } else {
        console.warn('⚠️ Transcription failed or empty:', response.data);
        alert('No speech detected. Please try speaking louder or closer to the microphone.');
      }
    } catch (error) {
      console.error('❌ Error transcribing audio:', error);
      
      let errorMessage = 'Voice transcription failed. ';
      const err = error as any;
      if (err?.response?.status === 503) {
        errorMessage += 'Service temporarily unavailable. Please try again later.';
      } else if (err?.response?.status === 429) {
        errorMessage += 'Too many requests. Please wait a moment and try again.';
      } else {
        errorMessage += 'Please check your connection and try again.';
      }
      
      alert(errorMessage);
    }
  }, [sendMessage]);

  // Event handlers
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  }, [inputMessage, sendMessage]);

  const handleMicrophoneToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Load chat history when component opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen, messages.length, loadChatHistory]);

  // Cleanup when component closes or unmounts
  useEffect(() => {
    if (!isOpen && isRecording) {
      stopRecording();
    }
  }, [isOpen, isRecording, stopRecording]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Render collapsed button when closed
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 border-2 border-silver"
        style={{
          backgroundColor: `var(--theme-primary)`,
          color: 'white',
          zIndex: 1000,
          right: `${position.x}px`,
          bottom: `${window.innerHeight - position.y - 60}px`
        }}
        aria-label="Open chat assistant"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  // Main chat interface
  return (
    <div
      ref={chatRef}
      className="fixed rounded-2xl shadow-2xl flex flex-col border-2 border-silver"
      style={{
        backgroundColor: `var(--theme-background)`,
        zIndex: 1000,
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
      role="dialog"
      aria-label="Chakrai Chat Assistant"
      aria-modal="true"
    >
      {/* Header */}
      <div 
        className="p-4 rounded-t-2xl flex items-center justify-between border-b drag-handle cursor-grab"
        style={{ 
          backgroundColor: `var(--theme-surface)`,
          borderColor: `var(--theme-accent)`
        }}
        role="banner"
      >
        <div className="flex items-center space-x-2 drag-handle">
          <Move size={16} className="theme-text drag-handle opacity-50" aria-hidden="true" />
          <MessageCircle size={20} className="theme-text drag-handle" aria-hidden="true" />
          <h3 className="font-semibold theme-text drag-handle">Chakrai Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs theme-text-secondary" aria-label={`Chat window size: ${size.width} by ${size.height} pixels`}>
            {size.width}x{size.height}
          </span>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/10 rounded theme-text"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3" 
        style={{ userSelect: 'text' }}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl ${
                message.sender === 'user' 
                  ? 'rounded-br-md' 
                  : 'rounded-bl-md'
              }`}
              style={{
                backgroundColor: message.sender === 'user' 
                  ? `var(--theme-primary)` 
                  : `var(--theme-surface)`,
                border: message.sender === 'user' ? 'none' : `1px solid var(--theme-accent)`
              }}
              role={message.sender === 'user' ? 'article' : 'article'}
              aria-label={`${message.sender === 'user' ? 'Your' : 'Assistant'} message at ${message.time}`}
            >
              <p className="text-sm">{message.text}</p>
              <span className="text-xs theme-text-secondary mt-1 block">{message.time}</span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div 
              className="p-3 rounded-2xl"
              style={{
                backgroundColor: `var(--theme-surface)`,
                border: `1px solid var(--theme-accent)`
              }}
              role="status"
              aria-label="Assistant is typing"
            >
              <div className="flex space-x-1">
                <div 
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: `var(--theme-accent)` }}
                  aria-hidden="true"
                ></div>
                <div 
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ 
                    backgroundColor: `var(--theme-accent)`,
                    animationDelay: '0.1s'
                  }}
                  aria-hidden="true"
                ></div>
                <div 
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ 
                    backgroundColor: `var(--theme-accent)`,
                    animationDelay: '0.2s'
                  }}
                  aria-hidden="true"
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div 
        className="p-4 border-t"
        style={{ borderColor: `var(--theme-accent)` }}
        role="form"
        aria-label="Message input area"
      >
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full rounded-xl px-4 py-2 theme-text focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
              style={{
                backgroundColor: `var(--theme-surface)`,
                border: `1px solid var(--theme-accent)`
              }}
              disabled={isLoading || isRecording}
              aria-label="Type your message"
              aria-describedby="input-help"
            />
            <span id="input-help" className="sr-only">
              Press Enter to send message, Shift+Enter for new line
            </span>
          </div>
          
          {/* Voice controls */}
          {selectedVoice && (
            <div className="flex space-x-1">
              {lastAudioData && (
                <button
                  onClick={() => playBase64Audio(lastAudioData)}
                  className="p-2 rounded-xl transition-colors theme-text"
                  style={{
                    backgroundColor: `var(--theme-surface)`,
                    border: `1px solid var(--theme-accent)`
                  }}
                  disabled={isPlayingVoice}
                  aria-label="Play last voice response"
                  title="Replay last voice response"
                >
                  <Volume2 size={18} />
                </button>
              )}
              <button
                onClick={isPlayingVoice ? stopVoice : undefined}
                className="p-2 rounded-xl transition-colors theme-text"
                style={{
                  backgroundColor: isPlayingVoice 
                    ? '#ef4444' 
                    : `var(--theme-surface)`,
                  border: `1px solid var(--theme-accent)`
                }}
                disabled={!isPlayingVoice}
                aria-label={isPlayingVoice ? "Stop voice playback" : "Voice controls"}
              >
                {isPlayingVoice ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
          )}

          {/* Microphone button */}
          <button
            onClick={handleMicrophoneToggle}
            className={`p-2 rounded-xl transition-colors ${
              isRecording ? 'animate-pulse' : ''
            }`}
            style={{
              backgroundColor: isRecording 
                ? '#ef4444' 
                : `var(--theme-primary)`,
              border: `1px solid var(--theme-accent)`,
              color: 'white'
            }}
            disabled={isLoading}
            aria-label={isRecording ? "Stop voice recording" : "Start voice recording"}
          >
            {isRecording ? (
              <Square size={18} />
            ) : (
              <Mic size={18} />
            )}
          </button>

          {/* Send button */}
          <button
            onClick={() => sendMessage(inputMessage)}
            className="p-2 rounded-xl transition-colors disabled:opacity-50 theme-text border-2 border-silver"
            style={{
              backgroundColor: `var(--theme-primary)`,
              color: 'white'
            }}
            disabled={isLoading || !inputMessage.trim()}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        
        {isRecording && (
          <div 
            className="mt-2 text-center animate-pulse"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              <span className="text-sm font-medium text-red-600">
                Recording... (10 seconds max)
              </span>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Click microphone button to stop early
            </div>
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-50 hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(-45deg, transparent 0%, transparent 30%, var(--theme-accent) 30%, var(--theme-accent) 35%, transparent 35%, transparent 65%, var(--theme-accent) 65%, var(--theme-accent) 70%, transparent 70%)`
        }}
        onMouseDown={handleResizeStart}
        aria-label="Resize chat window"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleResizeStart(e as any);
          }
        }}
      />
    </div>
  );
};

export default FloatingChat;