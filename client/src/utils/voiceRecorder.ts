// Web Audio API-based voice recorder for OpenAI Whisper compatibility
// Uses proper WAV encoding to avoid transcription issues

import { WebAudioRecorder } from './webAudioRecorder';

export interface VoiceRecorderOptions {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: 'idle' | 'recording' | 'processing') => void;
  maxDuration?: number; // seconds
  minDuration?: number; // seconds
}

export class VoiceRecorder {
  private webAudioRecorder: WebAudioRecorder | null = null;
  private isRecording = false;
  private options: VoiceRecorderOptions;
  private startTime = 0;
  private recordingTimeout: NodeJS.Timeout | null = null;

  constructor(options: VoiceRecorderOptions) {
    this.options = {
      maxDuration: 30,
      minDuration: 2,
      ...options
    };
  }

  async startRecording(): Promise<void> {
    try {
      this.options.onStatusChange?.('recording');
      
      console.log('ðŸŽµ Starting WebAudioRecorder for proper WAV generation');
      
      this.webAudioRecorder = new WebAudioRecorder();
      await this.webAudioRecorder.startRecording();
      
      this.startTime = Date.now();
      this.isRecording = true;

      // Auto-stop after max duration
      if (this.options.maxDuration) {
        this.recordingTimeout = setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
          }
        }, this.options.maxDuration * 1000);
      }

    } catch (error) {
      console.error('Failed to start WebAudioRecorder:', error);
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
    if (this.webAudioRecorder && this.isRecording) {
      const audioBlob = this.webAudioRecorder.stopRecording();
      this.isRecording = false;
      
      if (this.recordingTimeout) {
        clearTimeout(this.recordingTimeout);
        this.recordingTimeout = null;
      }
      
      this.processRecording(audioBlob);
    }
  }

  private async processRecording(audioBlob: Blob): Promise<void> {
    try {
      this.options.onStatusChange?.('processing');
      
      const duration = (Date.now() - this.startTime) / 1000;
      
      if (duration < (this.options.minDuration || 2)) {
        this.options.onError?.('Recording too short. Please speak for at least 2 seconds.');
        this.cleanup();
        return;
      }

      console.log('ðŸŽµ Processing WebAudio-generated WAV:', {
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
      
      // Always use WAV filename since WebAudioRecorder creates proper WAV files
      const fileName = 'recording.wav';
      
      formData.append('audio', audioBlob, fileName);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('ðŸŽµ Raw transcription result:', data);
      
      if (data.text && data.text.trim()) {
        const transcription = data.text.trim();
        // Accept ANY transcription that's not the known "you" artifact
        if (transcription !== 'you' && transcription !== 'You' && transcription.length > 0) {
          this.options.onTranscription(transcription);
        } else {
          console.log('ðŸš« Rejected OpenAI Whisper artifact:', transcription);
          this.options.onError?.('OpenAI Whisper returned artifact "you". Try speaking more slowly and distinctly, closer to microphone.');
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
    
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
    
    this.webAudioRecorder = null;
    this.options.onStatusChange?.('idle');
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}
