// COMPLETELY REWRITTEN VOICE RECORDING SYSTEM
// This replaces all the broken voice recording functionality across the app

export interface VoiceRecorderOptions {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: 'idle' | 'recording' | 'processing') => void;
  maxDuration?: number; // seconds
  minDuration?: number; // seconds
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private options: VoiceRecorderOptions;
  private startTime = 0;

  constructor(options: VoiceRecorderOptions) {
    this.options = {
      maxDuration: 60,
      minDuration: 1,
      ...options
    };
  }

  async startRecording(): Promise<void> {
    try {
      this.options.onStatusChange?.('recording');
      
      // Request microphone access with optimal settings
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100, // Higher quality for better transcription
          channelCount: 1
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // CRITICAL: Use WAV for better OpenAI Whisper compatibility
      let mimeType = 'audio/wav';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            throw new Error('No supported audio format found');
          }
        }
      }

      console.log('🎵 VoiceRecorder using format:', mimeType);
      
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.audioChunks = [];
      this.startTime = Date.now();
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.processRecording();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.options.onError?.('Recording failed. Please try again.');
        this.cleanup();
      };

      this.mediaRecorder.start();

      // Auto-stop after max duration
      if (this.options.maxDuration) {
        setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
          }
        }, this.options.maxDuration * 1000);
      }

    } catch (error) {
      console.error('Failed to start recording:', error);
      let errorMessage = 'Could not access microphone.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied. Please allow access and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please check your device.';
        }
      }
      
      this.options.onError?.(errorMessage);
      this.cleanup();
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  private async processRecording(): Promise<void> {
    try {
      this.options.onStatusChange?.('processing');
      
      const duration = (Date.now() - this.startTime) / 1000;
      
      if (duration < (this.options.minDuration || 1)) {
        this.options.onError?.('Recording too short. Please speak for at least 1 second.');
        this.cleanup();
        return;
      }

      if (this.audioChunks.length === 0) {
        this.options.onError?.('No audio recorded. Please try again.');
        this.cleanup();
        return;
      }

      // Determine correct MIME type from MediaRecorder
      const mimeType = this.mediaRecorder?.mimeType || 'audio/mp4';
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });
      
      console.log('🎵 Processing audio:', {
        size: audioBlob.size,
        duration: duration,
        type: audioBlob.type
      });

      if (audioBlob.size < 1000) {
        this.options.onError?.('Recording appears to be empty. Please try again.');
        this.cleanup();
        return;
      }

      // Send to transcription
      await this.transcribeAudio(audioBlob);
      
    } catch (error) {
      console.error('Error processing recording:', error);
      this.options.onError?.('Failed to process recording. Please try again.');
    } finally {
      this.cleanup();
    }
  }

  private async transcribeAudio(audioBlob: Blob): Promise<void> {
    try {
      const formData = new FormData();
      
      // Use correct filename based on MIME type
      let fileName = 'recording.wav';
      if (audioBlob.type.includes('mp4')) {
        fileName = 'recording.m4a';
      } else if (audioBlob.type.includes('webm')) {
        fileName = 'recording.webm';
      } else if (audioBlob.type.includes('wav')) {
        fileName = 'recording.wav';
      }
      
      formData.append('audio', audioBlob, fileName);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('🎵 Raw transcription result:', data);
      
      if (data.text && data.text.trim()) {
        const transcription = data.text.trim();
        // Filter out common Whisper artifacts but be less aggressive
        if (transcription.length >= 2 && transcription !== 'you' && transcription !== 'Thank you.' && transcription !== 'Bye.') {
          this.options.onTranscription(transcription);
        } else {
          console.log('🚫 Filtered out likely artifact:', transcription);
          this.options.onError?.('Recording was too unclear. Please try speaking louder and more clearly.');
        }
      } else {
        this.options.onError?.('No speech detected. Please try again with clear speech.');
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      this.options.onError?.('Transcription service unavailable. Please try again.');
    }
  }

  private cleanup(): void {
    this.isRecording = false;
    this.audioChunks = [];
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.options.onStatusChange?.('idle');
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}