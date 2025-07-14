import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, Square, Volume2, VolumeX } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

interface FloatingChatProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedVoice: string;
}

const FloatingChat: React.FC<FloatingChatProps> = ({ isOpen, onToggle, selectedVoice }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when component opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      // Generate device fingerprint for anonymous user identification
      const deviceFingerprint = `browser_${navigator.userAgent.slice(0, 50)}_${screen.width}x${screen.height}_${new Date().getTimezoneOffset()}`;
      
      const response = await axios.get('/api/chat/history/1?limit=50', {
        headers: {
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-Id': `session_${Date.now()}`
        }
      });
      const chatHistory = response.data.messages || [];
      
      console.log('Chat history loaded:', chatHistory.length, 'messages');
      
      if (chatHistory.length > 0) {
        setMessages(chatHistory);
      } else {
        // Only show greeting if no chat history exists
        setMessages([{
          sender: 'bot',
          text: 'Hello! I\'m Chakrai, How are you feeling today?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Fallback to greeting message
      setMessages([{
        sender: 'bot',
        text: 'Hello! I\'m Chakrai, How are you feeling today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Generate device fingerprint for anonymous user identification
      const deviceFingerprint = `browser_${navigator.userAgent.slice(0, 50)}_${screen.width}x${screen.height}_${new Date().getTimezoneOffset()}`;
      
      const response = await axios.post('/api/chat', {
        message: text.trim(),
        context: 'floating_chat'
      }, {
        headers: {
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-Id': `session_${Date.now()}`
        }
      });

      const botMessage: Message = {
        sender: 'bot',
        text: response.data.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);

      // Auto-play voice response if voice is enabled
      if (selectedVoice && response.data.response) {
        playVoiceResponse(response.data.response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        sender: 'bot',
        text: 'I apologize, but I\'m having trouble responding right now. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const playVoiceResponse = async (text: string) => {
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
      audioRef.current.volume = 0.8; // Set reasonable volume
      audioRef.current.onended = () => {
        setIsPlayingVoice(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsPlayingVoice(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      // Try to play with better error handling
      try {
        await audioRef.current.play();
      } catch (playError) {
        console.error('Autoplay prevented:', playError);
        // If autoplay fails, we could show a play button or try again later
        setIsPlayingVoice(false);
        URL.revokeObjectURL(audioUrl);
      }
    } catch (error) {
      console.error('Error playing voice:', error);
      setIsPlayingVoice(false);
    }
  };

  const stopVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingVoice(false);
    }
  };

  const startRecording = async () => {
    try {
      console.log('🔧 MOBILE MICROPHONE DEBUG: Starting recording...');
      console.log('📱 User Agent:', navigator.userAgent);
      console.log('🎧 MediaDevices available:', !!navigator.mediaDevices);
      console.log('🎤 getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);
      
      // Test basic audio access first
      console.log('🔍 Testing basic audio constraints...');
      const basicConstraints = { audio: true };
      
      try {
        const testStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        console.log('✅ Basic audio access works');
        testStream.getTracks().forEach(track => track.stop());
      } catch (basicError) {
        console.error('❌ Basic audio access failed:', basicError);
        throw basicError;
      }
      
      // Enhanced mobile-specific audio constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      };

      console.log('🎯 Requesting microphone with enhanced constraints...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Enhanced microphone access granted');

      // Mobile-friendly MIME type detection with expanded fallbacks
      console.log('🧪 Testing MediaRecorder support...');
      console.log('📊 MediaRecorder available:', !!window.MediaRecorder);
      
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4;codecs=mp4a.40.2', 
        'audio/mp4',
        'audio/aac',
        'audio/mpeg',
        'audio/wav',
        '' // Default fallback
      ];
      
      let mimeType = '';
      for (const type of mimeTypes) {
        const supported = MediaRecorder.isTypeSupported(type);
        console.log(`🎵 ${type || 'default'}: ${supported ? '✅' : '❌'}`);
        if (supported && !mimeType) {
          mimeType = type;
        }
      }

      console.log('🎯 Selected MIME type:', mimeType || 'default');

      console.log('🎬 Creating MediaRecorder...');
      const recorderOptions = mimeType ? { mimeType } : {};
      console.log('⚙️ Recorder options:', recorderOptions);
      
      const recorder = new MediaRecorder(stream, recorderOptions);
      const chunks: Blob[] = [];
      
      console.log('📡 MediaRecorder state:', recorder.state);
      console.log('🎛️ MediaRecorder mimeType:', recorder.mimeType);

      recorder.ondataavailable = (event) => {
        console.log('📦 Audio data chunk:', event.data.size, 'bytes, type:', event.data.type);
        if (event.data.size > 0) {
          chunks.push(event.data);
        } else {
          console.warn('⚠️ Received empty audio chunk');
        }
      };

      recorder.onstop = async () => {
        console.log('🔴 Recording stopped, processing audio...');
        console.log('📊 Total chunks collected:', chunks.length);
        
        if (chunks.length > 0) {
          // Log each chunk for debugging
          chunks.forEach((chunk, index) => {
            console.log(`📦 Chunk ${index + 1}: ${chunk.size} bytes, type: ${chunk.type}`);
          });

          const audioBlob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
          console.log('🎵 Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type);
          console.log('🎯 Recorder MIME type used:', recorder.mimeType);
          
          if (audioBlob.size < 1000) {
            console.warn('⚠️ Very small audio file:', audioBlob.size, 'bytes');
            console.log('🔍 This might be too short for transcription');
          }

          console.log('🚀 Sending audio to transcription service...');
          await sendAudioToWhisper(audioBlob);
        } else {
          console.error('❌ No audio data captured');
          alert('No audio captured. Please try again and speak closer to the microphone.');
        }
        
        console.log('🧹 Cleaning up media stream...');
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onerror = (event) => {
        console.error('🔥 MediaRecorder error:', event);
        alert('Recording error occurred. Please try again.');
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording with frequent data collection for mobile
      console.log('🚀 Starting MediaRecorder...');
      recorder.start(500); // 500ms intervals for better mobile compatibility
      
      console.log('📝 Setting component state...');
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      
      console.log('✅ Recording started - state:', recorder.state);
      console.log('🎤 Component recording state updated');

      // Auto-stop after 30 seconds for safety
      setTimeout(() => {
        if (recorder.state === 'recording') {
          console.log('⏰ Auto-stopping recording after 30 seconds');
          stopRecording();
        }
      }, 30000);

    } catch (error) {
      console.error('🚨 Mobile microphone error:', error);
      const err = error as any;
      
      let errorMessage = 'Microphone access failed. ';
      if (err?.name === 'NotAllowedError') {
        errorMessage += 'Please allow microphone permission in your browser settings and try again.';
      } else if (err?.name === 'NotFoundError') {
        errorMessage += 'No microphone detected. Please check your device.';
      } else if (err?.name === 'NotReadableError') {
        errorMessage += 'Microphone is being used by another app. Please close other apps and try again.';
      } else if (err?.name === 'OverconstrainedError') {
        errorMessage += 'Your device microphone doesn\'t support the required settings.';
      } else {
        errorMessage += `Error: ${err?.message || 'Unknown error'}`;
      }
      
      alert(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToWhisper = async (audioBlob: Blob) => {
    try {
      console.log('🎯 Sending audio to Whisper for transcription...');
      console.log('📊 Audio size:', audioBlob.size, 'bytes, type:', audioBlob.type);
      
      if (audioBlob.size < 500) {
        console.error('❌ Audio file too small:', audioBlob.size, 'bytes');
        alert('Recording too short. Please speak for at least 1-2 seconds.');
        return;
      } else if (audioBlob.size < 1000) {
        console.warn('⚠️ Small audio file:', audioBlob.size, 'bytes - proceeding anyway');
      }

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      console.log('🚀 Uploading audio for transcription...');
      const response = await axios.post('/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 // 30 second timeout
      });

      console.log('✅ Transcription response:', response.data);

      if (response.data.text && response.data.text.trim()) {
        console.log('📝 Transcribed text:', response.data.text);
        await sendMessage(response.data.text);
      } else {
        console.error('❌ No text transcribed');
        alert('Could not understand the audio. Please try speaking more clearly.');
      }
    } catch (error) {
      console.error('🚨 Transcription error:', error);
      const err = error as any;
      
      let errorMessage = 'Voice transcription failed. ';
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        errorMessage += 'Request timed out. Please try a shorter recording.';
      } else if (err?.response?.status === 413) {
        errorMessage += 'Recording file too large. Please record for less time.';
      } else if (err?.response?.status === 401) {
        errorMessage += 'API key issue. Please check voice settings.';
      } else {
        errorMessage += 'Please check your internet connection and try again.';
      }
      
      alert(errorMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  // Chat bubble when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onToggle}
          className="theme-primary hover:theme-primary-dark theme-text p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 animate-pulse"
          style={{ 
            backdropFilter: 'blur(10px)',
            background: `linear-gradient(135deg, var(--theme-primary), var(--theme-accent))`
          }}
        >
          <MessageCircle size={24} />
        </button>
      </div>
    );
  }

  // Floating chat box when open
  return (
    <div 
      className="fixed bottom-6 right-6 w-96 h-[500px] backdrop-blur-xl border-2 border-silver rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--theme-background), var(--theme-surface))`
      }}
    >
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, var(--theme-primary), var(--theme-accent))`
        }}
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <MessageCircle size={20} className="theme-text" />
          </div>
          <div>
            <h3 className="theme-text font-semibold">Chakrai Companion</h3>
            <p className="theme-text-secondary text-xs">Always here to help</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="theme-text-secondary hover:theme-text transition-colors p-1 hover:bg-white/10 rounded-full"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[80%] p-3 rounded-2xl theme-text"
              style={{
                background: message.sender === 'user'
                  ? `linear-gradient(135deg, var(--theme-primary), var(--theme-accent))`
                  : `var(--theme-surface)`,
                border: message.sender === 'user' ? 'none' : `1px solid var(--theme-accent)`
              }}
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
            >
              <div className="flex space-x-1">
                <div 
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: `var(--theme-accent)` }}
                ></div>
                <div 
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ 
                    backgroundColor: `var(--theme-accent)`,
                    animationDelay: '0.1s'
                  }}
                ></div>
                <div 
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ 
                    backgroundColor: `var(--theme-accent)`,
                    animationDelay: '0.2s'
                  }}
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
      >
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full rounded-xl px-4 py-2 theme-text theme-text-secondary focus:outline-none focus:ring-1"
              style={{
                backgroundColor: `var(--theme-surface)`,
                border: `1px solid var(--theme-accent)`,
                '&:focus': {
                  borderColor: `var(--theme-primary)`,
                  boxShadow: `0 0 0 1px var(--theme-primary)`
                }
              }}
              disabled={isLoading || isRecording}
            />
          </div>
          
          {/* Voice controls */}
          {selectedVoice && (
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
            >
              {isPlayingVoice ? <VolumeX size={18} /> : <Volume2 size={24} />}
            </button>
          )}

          {/* Enhanced Mobile Microphone button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-xl transition-all duration-300 theme-text border-2 border-silver min-w-[48px] min-h-[48px] flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 ${
              isRecording ? 'animate-pulse scale-110' : 'hover:scale-110'
            }`}
            style={{
              backgroundColor: isRecording 
                ? '#ef4444'
                : `var(--theme-primary)`,
              touchAction: 'manipulation'
            }}
            disabled={isLoading}
            title={isRecording ? "Tap to stop recording and send" : "Tap to start voice recording"}
          >
            {isRecording ? (
              <Square size={20} className="text-white" />
            ) : (
              <Mic size={24} className="text-white" />
            )}
          </button>

          {/* Send button */}
          <button
            onClick={() => sendMessage(inputMessage)}
            className="p-2 rounded-xl transition-colors disabled:opacity-50 theme-text border-2 border-silver"
            style={{
              backgroundColor: `var(--theme-primary)`
            }}
            disabled={isLoading || !inputMessage.trim()}
          >
            <Send size={24} />
          </button>
        </div>
        
        {isRecording && (
          <p className="text-xs mt-2 text-center animate-pulse" style={{ color: '#ef4444' }}>
            🎤 Recording... Tap the square to stop & send
          </p>
        )}
      </div>
    </div>
  );
};

export default FloatingChat;