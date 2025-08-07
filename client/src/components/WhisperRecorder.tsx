import React, { useState, useRef } from 'react';

interface WhisperRecorderProps {
  onTranscription: (text: string) => void;
  onResponse?: (response: string) => void;
}

export default function WhisperRecorder({ onTranscription, onResponse }: WhisperRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks: BlobPart[] = [];

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1
      }
    });
    
    // CRITICAL FIX: Use WAV first for best Whisper compatibility
    let mimeType = 'audio/wav';
    let options: MediaRecorderOptions = { mimeType };
    
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/webm;codecs=opus';
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options = { mimeType, audioBitsPerSecond: 128000 };
      } else {
        mimeType = 'audio/mp4';
        options = { mimeType };
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          throw new Error('Browser does not support WAV, WebM, or MP4 recording.');
        }
      }
    }
    
    console.log('🎵 WhisperRecorder using audio format:', mimeType, 'with options:', options);
    const mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorderRef.current = mediaRecorder;
    setRecording(true);
    chunks.length = 0;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      // Use the same mimeType that was used for recording
      const blob = new Blob(chunks, { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);
      setAudioUrl(audioUrl);
      setProcessing(true);

      const formData = new FormData();
      let fileName = 'recording.wav';
      if (mimeType.includes('mp4')) {
        fileName = 'recording.mp4';
      } else if (mimeType.includes('webm')) {
        fileName = 'recording.webm';
      }
      
      console.log('📤 Sending audio to transcription:', {
        size: blob.size,
        type: mimeType,
        fileName: fileName,
        sizeKB: Math.round(blob.size / 1024)
      });
      
      formData.append('audio', blob, fileName);

      try {
        const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.text) {
          setTranscription(data.text);
          onTranscription?.(data.text); // Pass raw transcript to parent
        }
      } catch (err) {
        console.error('Transcription failed:', err);
      } finally {
        setProcessing(false);
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      }
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const sendToBot = async () => {
    if (!transcription) return;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: transcription, botId: 2 })
    });
    const data = await res.json();
    
    if (onResponse) {
      onResponse(data.response);
    }

    // Play TTS response using ElevenLabs
    try {
      const ttsRes = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: data.response,
          voiceId: 'EkK5I93UQWFDigLMpZcX' // Default James voice
        })
      });

      if (ttsRes.ok) {
        const audioBlob = await ttsRes.blob();
        console.log('WhisperRecorder audio blob size:', audioBlob.size);
        
        if (audioBlob.size > 0) {
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.volume = 1.0;
          
          audio.onended = () => URL.revokeObjectURL(audioUrl);
          
          audio.play().then(() => {
            console.log('WhisperRecorder audio playing successfully');
          }).catch(error => {
            console.log('WhisperRecorder audio playback failed:', error);
          });
        } else {
          console.log('WhisperRecorder received empty audio blob');
        }
      } else {
        console.log('WhisperRecorder TTS request failed:', ttsRes.status);
      }
    } catch (error) {
      console.log('WhisperRecorder TTS error:', error);
    }

    setTranscription('');
    setAudioUrl('');
  };

  return (
    <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 text-white">
      <div className="flex items-center gap-4">
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={processing}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            processing
              ? 'bg-gray-600 cursor-not-allowed'
              : recording
              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {processing ? '🔄 Processing...' : recording ? '⏹️ Stop Recording' : '🎤 Start Whisper Recording'}
        </button>
        {audioUrl && (
          <audio controls src={audioUrl} className="ml-4 max-w-xs" />
        )}
      </div>

      {transcription && (
        <div className="mt-4">
          <p className="text-sm text-gray-300 mb-2">📝 Transcription:</p>
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-600 mb-3">{transcription}</div>
          <button
            onClick={sendToBot}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Send Message
          </button>
        </div>
      )}
    </div>
  );
}