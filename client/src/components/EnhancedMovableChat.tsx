import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Mic, Square, Volume2, VolumeX, Move, Settings, User } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosResponse } from 'axios';

// Avatar component with therapeutic design
const TherapeuticAvatar: React.FC<{ isActive: boolean; mood?: string }> = ({ isActive, mood = 'calm' }) => {
  const avatarColors = {
    calm: 'from-blue-400 to-blue-600',
    listening: 'from-green-400 to-green-600', 
    thinking: 'from-purple-400 to-purple-600',
    speaking: 'from-cyan-400 to-cyan-600'
  };

  return (
    <div className={`relative w-12 h-12 rounded-full overflow-hidden ${isActive ? 'ring-2 ring-white shadow-lg' : ''}`}>
      <div className={`w-full h-full bg-gradient-to-br ${avatarColors[mood as keyof typeof avatarColors]} flex items-center justify-center`}>
        <User className="w-6 h-6 text-white" />
        {isActive && (
          <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse rounded-full"></div>
        )}
      </div>
    </div>
  );
};

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

interface EnhancedMovableChatProps {
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
const EnhancedMovableChat: React.FC<EnhancedMovableChatProps> = ({ isOpen, onToggle, selectedVoice }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [avatarMood, setAvatarMood] = useState<'calm' | 'listening' | 'thinking' | 'speaking'>('calm');
  
  // Dragging and resizing state
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [size, setSize] = useState({ width: 400, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Refs
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());
  const deviceFingerprintRef = useRef<string>(generateDeviceFingerprint());

  const queryClient = useQueryClient();

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Window resize handling to keep chat in view
  useEffect(() => {
    const handleResize = () => {
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      setPosition(prev => ({
        x: Math.min(prev.x, Math.max(0, maxX)),
        y: Math.min(prev.y, Math.max(0, maxY))
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size]);

  // Load chat history when opened
  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  // Chat API mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string): Promise<ChatApiResponse> => {
      const response: AxiosResponse<ChatApiResponse> = await axios.post('/api/chat', {
        message,
        deviceFingerprint: deviceFingerprintRef.current,
        sessionId: sessionIdRef.current,
        voiceEnabled: true,
        selectedVoice
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.response || data.message) {
        const botResponse = data.response || data.message || '';
        const responseTimestamp = Date.now();
        const botMessage: Message = {
          id: generateUniqueId(),
          sender: 'bot',
          text: botResponse,
          time: new Date(responseTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: responseTimestamp
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        // Play voice response if available
        if (data.audio && selectedVoice) {
          playVoiceResponse(data.audio);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
    },
    onError: (error) => {
      console.error('Chat error:', error);
      const errorTimestamp = Date.now();
      const errorMessage: Message = {
        id: generateUniqueId(),
        sender: 'bot',
        text: 'I apologize, but I\'m having trouble responding right now. Please try again.',
        time: new Date(errorTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: errorTimestamp
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const loadChatHistory = async () => {
    try {
      const response = await axios.get(`/api/chat/history/${deviceFingerprintRef.current}?limit=50`);
      if (response.data.success && response.data.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = useCallback(async (messageText: string = inputMessage) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isLoading) return;

    setAvatarMood('thinking');
    setIsLoading(true);
    
    const timestamp = Date.now();
    const userMessage: Message = {
      id: generateUniqueId(),
      sender: 'user',
      text: trimmedMessage,
      time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    try {
      await chatMutation.mutateAsync(trimmedMessage);
      setAvatarMood('calm');
    } catch (error) {
      setAvatarMood('calm');
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, chatMutation]);

  const playVoiceResponse = useCallback(async (audioData: string): Promise<void> => {
    if (!selectedVoice || isPlayingVoice) return;

    setIsPlayingVoice(true);
    setAvatarMood('speaking');
    
    try {
      // Handle base64 audio data
      const audioBlob = new Blob([new Uint8Array(atob(audioData).split('').map(char => char.charCodeAt(0)))], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.volume = 0.8;
      audioRef.current.onended = () => {
        setIsPlayingVoice(false);
        setAvatarMood('calm');
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        console.error('Audio playback error');
        setIsPlayingVoice(false);
        setAvatarMood('calm');
        URL.revokeObjectURL(audioUrl);
      };
      
      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing voice:', error);
      setIsPlayingVoice(false);
      setAvatarMood('calm');
    }
  }, [selectedVoice, isPlayingVoice]);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setAvatarMood('listening');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone not supported in this browser');
      }

      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav'];
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, selectedMimeType ? { mimeType: selectedMimeType } : {});
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setIsRecording(false);
        setAvatarMood('thinking');
        
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType || 'audio/webm' });
          await sendAudioToWhisper(audioBlob);
          audioChunksRef.current = [];
        }
        setAvatarMood('calm');
      };
      
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setAvatarMood('calm');
    }
  }, []);

  const stopRecording = useCallback((): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const sendAudioToWhisper = async (audioBlob: Blob): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await axios.post('/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success && response.data.transcription) {
        await sendMessage(response.data.transcription);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  };

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      const rect = chatRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      setPosition({
        x: Math.min(Math.max(0, newX), maxX),
        y: Math.min(Math.max(0, newY), maxY)
      });
    }
  }, [isDragging, dragOffset, size]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <div
      ref={chatRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        userSelect: isDragging ? 'none' : 'auto'
      }}
    >
      {/* Header with Avatar */}
      <div
        className="drag-handle flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 border-b border-gray-200 dark:border-gray-700 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-3">
          <TherapeuticAvatar isActive={isLoading || isRecording || isPlayingVoice} mood={avatarMood} />
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">Chakrai</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isRecording ? 'Listening...' : isLoading ? 'Thinking...' : isPlayingVoice ? 'Speaking...' : 'Your Wellness Companion'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSize(prev => ({ ...prev, width: prev.width === 400 ? 500 : 400, height: prev.height === 600 ? 700 : 600 }))}
            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Resize chat"
          >
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 rounded-lg transition-colors"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <TherapeuticAvatar isActive={false} mood="calm" />
            <p className="mt-4">Welcome! I'm here to support your wellness journey.</p>
            <p className="text-sm mt-2">Feel free to share what's on your mind.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex items-start space-x-2 max-w-[80%]">
              {message.sender === 'bot' && (
                <TherapeuticAvatar isActive={false} mood="calm" />
              )}
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white ml-auto'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">{message.time}</p>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <TherapeuticAvatar isActive={true} mood="thinking" />
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Share what's on your mind..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              disabled={isLoading || isRecording}
            />
          </div>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
            }`}
            disabled={isLoading}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading || isRecording}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {isPlayingVoice && (
          <div className="flex items-center justify-center mt-2 text-sm text-blue-600 dark:text-blue-400">
            <Volume2 className="w-4 h-4 mr-1" />
            Playing voice response...
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMovableChat;