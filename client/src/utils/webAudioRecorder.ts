// Web Audio API-based recorder that creates actual WAV files
// This bypasses MediaRecorder limitations and creates proper audio for OpenAI Whisper

export class WebAudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private recording = false;
  private audioData: Float32Array[] = [];
  private sampleRate = 44100;

  async startRecording(): Promise<void> {
    try {
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.sampleRate,
          channelCount: 1
        }
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.sampleRate
      });

      // Create source node from microphone
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create processor node to capture audio data
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.audioData = [];
      this.recording = true;

      // Capture audio data
      this.processorNode.onaudioprocess = (event) => {
        if (!this.recording) return;
        
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Copy the data
        const audioChunk = new Float32Array(inputData.length);
        audioChunk.set(inputData);
        this.audioData.push(audioChunk);
      };

      // Connect the nodes
      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      console.log('🎵 WebAudioRecorder started successfully');
      
    } catch (error) {
      console.error('Failed to start WebAudioRecorder:', error);
      throw error;
    }
  }

  stopRecording(): Blob {
    this.recording = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Convert captured audio data to WAV
    const wavBlob = this.createWAVBlob();
    console.log('🎵 WebAudioRecorder created WAV blob:', wavBlob.size, 'bytes');
    
    return wavBlob;
  }

  private createWAVBlob(): Blob {
    // Calculate total length
    const totalLength = this.audioData.reduce((sum, chunk) => sum + chunk.length, 0);
    
    // Merge all audio chunks
    const mergedData = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioData) {
      mergedData.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to 16-bit PCM
    const pcmData = new Int16Array(mergedData.length);
    for (let i = 0; i < mergedData.length; i++) {
      const sample = Math.max(-1, Math.min(1, mergedData[i]));
      pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }

    // Create WAV file
    const wavBuffer = this.createWAVBuffer(pcmData);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  private createWAVBuffer(pcmData: Int16Array): ArrayBuffer {
    const byteRate = this.sampleRate * 2; // 16-bit mono
    const blockAlign = 2; // 16-bit mono
    const dataSize = pcmData.length * 2;
    const fileSize = 36 + dataSize;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // 16-bit
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // PCM data
    const pcmView = new Int16Array(buffer, 44);
    pcmView.set(pcmData);

    return buffer;
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  isRecording(): boolean {
    return this.recording;
  }
}