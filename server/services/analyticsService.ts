// Phase 2: Analytics business logic service
import { JournalEntry } from '../storage.js';

export interface TriggerPattern {
  trigger: string;
  frequency: number;
  avgMoodBefore: number;
  avgMoodAfter: number;
  contexts: string[];
}

export interface TemporalPattern {
  timeOfDay: string;
  frequency: number;
  avgMood: number;
  commonEmotions: string[];
}

export class AnalyticsService {
  
  static async extractTriggerPatterns(entries: JournalEntry[]): Promise<TriggerPattern[]> {
    const triggers = new Map<string, {
      count: number;
      moodsBefore: number[];
      moodsAfter: number[];
      contexts: string[];
    }>();

    entries.forEach(entry => {
      // Extract potential triggers from content using simple keyword matching
      const content = entry.content.toLowerCase();
      const possibleTriggers = this.identifyTriggers(content);
      
      possibleTriggers.forEach(trigger => {
        if (!triggers.has(trigger)) {
          triggers.set(trigger, {
            count: 0,
            moodsBefore: [],
            moodsAfter: [],
            contexts: []
          });
        }
        
        const triggerData = triggers.get(trigger)!;
        triggerData.count++;
        
        // Use mood intensity as proxy for mood value
        if (entry.moodScore !== undefined) {
          triggerData.moodsBefore.push(entry.moodScore);
          // Assume mood after is slightly different (simplified)
          triggerData.moodsAfter.push(Math.max(1, entry.moodScore - 1));
        }
        
        triggerData.contexts.push(entry.content.substring(0, 50));
      });
    });

    // Convert to result format
    const patterns: TriggerPattern[] = [];
    for (const [trigger, data] of triggers.entries()) {
      if (data.count >= 2) { // Only include triggers that appear multiple times
        patterns.push({
          trigger,
          frequency: data.count,
          avgMoodBefore: data.moodsBefore.reduce((a, b) => a + b, 0) / data.moodsBefore.length || 0,
          avgMoodAfter: data.moodsAfter.reduce((a, b) => a + b, 0) / data.moodsAfter.length || 0,
          contexts: data.contexts.slice(0, 3) // Top 3 contexts
        });
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  static identifyTemporalPatterns(entries: JournalEntry[]): TemporalPattern[] {
    const timeSlots = new Map<string, {
      count: number;
      moods: number[];
      emotions: string[];
    }>();

    entries.forEach(entry => {
      const hour = new Date(entry.createdAt).getHours();
      const timeSlot = this.getTimeSlot(hour);
      
      if (!timeSlots.has(timeSlot)) {
        timeSlots.set(timeSlot, {
          count: 0,
          moods: [],
          emotions: []
        });
      }
      
      const slotData = timeSlots.get(timeSlot)!;
      slotData.count++;
      
      if (entry.moodScore !== undefined) {
        slotData.moods.push(entry.moodScore);
      }
      
      if (entry.emotionalTags) {
        slotData.emotions.push(...entry.emotionalTags);
      }
    });

    const patterns: TemporalPattern[] = [];
    for (const [timeSlot, data] of timeSlots.entries()) {
      if (data.count >= 2) {
        // Count emotion frequency
        const emotionCounts = data.emotions.reduce((acc, emotion) => {
          acc[emotion] = (acc[emotion] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const commonEmotions = Object.entries(emotionCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([emotion]) => emotion);

        patterns.push({
          timeOfDay: timeSlot,
          frequency: data.count,
          avgMood: data.moods.reduce((a, b) => a + b, 0) / data.moods.length || 0,
          commonEmotions
        });
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  static generateCopingStrategies(dominantEmotions: string[], averageValence: number): string[] {
    const strategies: string[] = [];
    
    // Emotion-specific strategies
    dominantEmotions.forEach(emotion => {
      switch (emotion.toLowerCase()) {
        case 'anxiety':
        case 'anxious':
          strategies.push('Practice deep breathing exercises when anxiety arises');
          break;
        case 'stress':
        case 'stressed':
          strategies.push('Use progressive muscle relaxation during stressful moments');
          break;
        case 'sadness':
        case 'sad':
          strategies.push('Engage in gentle physical activity when feeling down');
          break;
        case 'anger':
        case 'frustrated':
          strategies.push('Take a brief walk or practice counting to ten when frustrated');
          break;
        default:
          strategies.push(`Practice mindfulness to better understand your ${emotion} feelings`);
      }
    });
    
    // Valence-based strategies
    if (averageValence < 5) {
      strategies.push('Consider reaching out to a trusted friend or counselor');
      strategies.push('Schedule pleasant activities throughout your week');
    } else if (averageValence > 7) {
      strategies.push('Continue practices that support your positive emotional state');
      strategies.push('Consider how you can share your coping skills with others');
    }
    
    // General strategies
    strategies.push('Maintain a consistent sleep schedule to support emotional regulation');
    strategies.push('Practice gratitude by noting three positive things each day');
    
    return strategies.slice(0, 5); // Return top 5 strategies
  }

  private static identifyTriggers(content: string): string[] {
    const triggerKeywords = [
      'work', 'job', 'boss', 'deadline', 'stress', 'pressure',
      'family', 'relationship', 'friend', 'conflict', 'argument',
      'money', 'financial', 'bill', 'debt', 'payment',
      'health', 'illness', 'pain', 'tired', 'exhausted',
      'social', 'party', 'meeting', 'presentation', 'public',
      'change', 'moving', 'new', 'different', 'unknown'
    ];
    
    const triggers: string[] = [];
    
    triggerKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        triggers.push(keyword);
      }
    });
    
    return triggers;
  }

  private static getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'Morning (6AM-12PM)';
    if (hour >= 12 && hour < 18) return 'Afternoon (12PM-6PM)';
    if (hour >= 18 && hour < 22) return 'Evening (6PM-10PM)';
    return 'Night (10PM-6AM)';
  }
}