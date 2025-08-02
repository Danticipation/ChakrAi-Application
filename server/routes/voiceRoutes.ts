// Phase 2: Modularized voice routes using controllers
import express from 'express';
import multer from 'multer';
import { VoiceController } from '../controllers/voiceController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Voice processing routes
router.post('/transcribe', upload.single('audio'), VoiceController.transcribeAudio);
router.post('/tts', VoiceController.generateSpeech);

export default router;