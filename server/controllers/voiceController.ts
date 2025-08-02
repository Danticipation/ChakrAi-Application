// Phase 2: Extract business logic - Voice Controller  
import { Request, Response } from 'express';
import { ResponseService } from '../services/responseService.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { validateFileUpload, uploadLimiter } from '../middleware/security.js';
import { openai } from '../openaiRetry.js';

export class VoiceController {
  
  // Transcribe audio using OpenAI Whisper
  static transcribeAudio = [
    uploadLimiter,
    validateFileUpload,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.file) {
        return ResponseService.sendError(res, 'No audio file provided', 400);
      }

      console.log('🎤 Transcription request received:', {
        hasFile: !!req.file,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        userAgent: req.get('User-Agent')?.substring(0, 100),
        firstBytes: req.file.buffer.subarray(0, 20).toString('hex').replace(/(.{2})/g, '$1 ').trim()
      });

      try {
        // Validate file type and size
        const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          return ResponseService.sendError(res, 'Invalid file type', 400, 'INVALID_FILE_TYPE');
        }

        // Create a File-like object for OpenAI
        const audioFile = new File([req.file.buffer], 'audio.wav', {
          type: req.file.mimetype
        });

        console.log('📤 Sending to OpenAI Whisper:', {
          model: 'whisper-1',
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        });

        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          response_format: 'verbose_json',
          language: 'en'
        });

        console.log('✅ Transcription successful:', transcription.text);
        console.log('🔍 Full OpenAI response:', {
          text: transcription.text,
          usage: transcription.duration ? { type: 'duration', seconds: transcription.duration } : undefined
        });

        ResponseService.sendSuccess(res, {
          text: transcription.text,
          duration: transcription.duration,
          language: transcription.language || 'en'
        });

      } catch (error) {
        console.error('❌ Transcription failed:', error);
        
        // Provide specific error messages
        if (error instanceof Error) {
          if (error.message.includes('file_size')) {
            return ResponseService.sendError(res, 'Audio file too large', 400, 'FILE_TOO_LARGE');
          }
          if (error.message.includes('invalid_file')) {
            return ResponseService.sendError(res, 'Invalid audio file format', 400, 'INVALID_FILE_FORMAT');
          }
        }
        
        ResponseService.sendError(res, 'Failed to transcribe audio', 500, 'TRANSCRIPTION_ERROR');
      }
    })
  ];

  // Generate speech using ElevenLabs
  static generateSpeech = asyncHandler(async (req: Request, res: Response) => {
    const { text, voice = 'James' } = req.body;
    
    if (!text) {
      return ResponseService.sendError(res, 'Text is required', 400);
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return ResponseService.sendError(res, 'ElevenLabs API not configured', 503);
    }

    try {
      // Voice ID mapping (from existing implementation)
      const voiceIds: Record<string, string> = {
        'James': '5Q0t7uMcjvnagumLfvZi',
        'Brian': 'nPczCjzI2devNBz1zQrb', 
        'Alexandra': 'Xb7hH8MSUJpSbSDYk0k2',
        'Carla': 'z9fAnlkpzviPz146aGWa'
      };

      const selectedVoiceId = voiceIds[voice] || voiceIds['James'];
      
      // Clean text for TTS (reuse existing scrubTextForTTS function)
      const cleanText = this.scrubTextForTTS(text);

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600'
      });
      
      res.send(Buffer.from(audioBuffer));

    } catch (error) {
      console.error('TTS generation error:', error);
      ResponseService.sendError(res, 'Failed to generate speech', 500, 'TTS_ERROR');
    }
  });

  // Helper method to clean text for TTS (extracted from routes.ts)
  private static scrubTextForTTS(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_{2,}(.+?)_{2,}/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/###\s+/g, '')
      .replace(/##\s+/g, '')
      .replace(/#\s+/g, '')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/\*+/g, '')
      .replace(/#{3,}/g, '')
      .replace(/_{3,}/g, '')
      .replace(/`+/g, '')
      .replace(/\|/g, ' ')
      .replace(/\~/g, '')
      .replace(/\^/g, '')
      .replace(/\[|\]/g, '')
      .replace(/\{|\}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{3,}/g, ' ')
      .replace(/\.{3,}/g, '...')
      .replace(/&/g, ' and ')
      .replace(/@/g, ' at ')
      .replace(/%/g, ' percent ')
      .replace(/\$/g, ' dollars ')
      .replace(/\+/g, ' plus ')
      .replace(/=/g, ' equals ')
      .replace(/\s*:\s*$/gm, ':')
      .replace(/^\s*[-•]\s*/gm, '')
      .trim()
      .replace(/\s+/g, ' ');
  }
}