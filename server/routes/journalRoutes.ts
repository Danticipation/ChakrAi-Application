// Phase 2: Modularized routes using controllers
import express from 'express';
import { JournalController } from '../controllers/journalController.js';

const router = express.Router();

// Journal routes with pagination and validation
router.get('/users/:userId/entries', JournalController.getEntries);
router.post('/users/:userId/entries', JournalController.createEntry);
router.get('/users/:userId/analytics', JournalController.getAnalytics);
router.get('/users/:userId/patterns', JournalController.analyzePatterns);
router.put('/users/:userId/entries/:id', JournalController.updateEntry);
router.delete('/users/:userId/entries/:id', JournalController.deleteEntry);

export default router;