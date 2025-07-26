// Alarms API endpoints for wellness notifications and reminders
import { Request, Response } from 'express';
import { storage } from './storage';
import { insertAlarmSchema } from '@shared/schema';
import { getCurrentUserId } from './utils/getCurrentUserId';

// GET /api/alarms - Get all alarms for authenticated user
export async function GET(req: Request, res: Response) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const alarms = await storage.getUserAlarms(userId);
    res.json({ alarms });
  } catch (error) {
    console.error('Failed to fetch alarms:', error);
    res.status(500).json({ error: 'Failed to fetch alarms' });
  }
}

// POST /api/alarms - Create new alarm
export async function POST(req: Request, res: Response) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate request body
    const validation = insertAlarmSchema.safeParse({
      ...req.body,
      userId
    });

    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid alarm data',
        details: validation.error.issues
      });
    }

    const alarm = await storage.createAlarm(validation.data);
    console.log(`🔔 Alarm created: ${alarm.label} for user ${userId} at ${alarm.triggerAt}`);
    
    res.status(201).json({ 
      success: true, 
      alarm,
      message: 'Alarm scheduled successfully'
    });
  } catch (error) {
    console.error('Failed to create alarm:', error);
    res.status(500).json({ error: 'Failed to create alarm' });
  }
}

// DELETE /api/alarms - Delete alarm by ID
export async function DELETE(req: Request, res: Response) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.body;
    if (!id || typeof id !== 'number') {
      return res.status(400).json({ error: 'Alarm ID is required' });
    }

    // First verify the alarm belongs to the user
    const userAlarms = await storage.getUserAlarms(userId);
    const alarm = userAlarms.find(a => a.id === id);
    
    if (!alarm) {
      return res.status(404).json({ error: 'Alarm not found or access denied' });
    }

    await storage.deleteAlarm(id);
    console.log(`🗑️ Alarm deleted: ${id} by user ${userId}`);
    
    res.json({ 
      success: true,
      message: 'Alarm deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete alarm:', error);
    res.status(500).json({ error: 'Failed to delete alarm' });
  }
}

// PUT /api/alarms/:id - Update alarm
export async function PUT(req: Request, res: Response) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const alarmId = parseInt(req.params.id);
    if (isNaN(alarmId)) {
      return res.status(400).json({ error: 'Invalid alarm ID' });
    }

    // Verify alarm belongs to user
    const userAlarms = await storage.getUserAlarms(userId);
    const existingAlarm = userAlarms.find(a => a.id === alarmId);
    
    if (!existingAlarm) {
      return res.status(404).json({ error: 'Alarm not found or access denied' });
    }

    // Validate update data
    const updateData = insertAlarmSchema.partial().safeParse(req.body);
    if (!updateData.success) {
      return res.status(400).json({ 
        error: 'Invalid update data',
        details: updateData.error.issues
      });
    }

    const updatedAlarm = await storage.updateAlarm(alarmId, updateData.data);
    console.log(`✏️ Alarm updated: ${alarmId} by user ${userId}`);
    
    res.json({ 
      success: true, 
      alarm: updatedAlarm,
      message: 'Alarm updated successfully'
    });
  } catch (error) {
    console.error('Failed to update alarm:', error);
    res.status(500).json({ error: 'Failed to update alarm' });
  }
}