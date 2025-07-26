//utils/useractivity.tsa

import { getCurrentUserId } from '@/utils/userSession';

export const updateUserActivity = async (activityType) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return;

    await fetch('/api/users/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        activityType,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to update user activity:', error);
  }
};

export const recordAppVisit = async (currentUserId) => {
  try {
    if (!currentUserId) return;
    await fetch(`/api/users/${currentUserId}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityType: 'app_visit' }),
    });
  } catch (error) {
    console.error('Failed to record app visit:', error);
  }
};

export const fetchBotStats = async (setBotStats) => {
  try {
    const res = await fetch('/api/bot-stats');
    if (res.ok) {
      const data = await res.json();
      setBotStats(data);
    }
  } catch (error) {
    console.error('Failed to fetch bot stats:', error);
  }
};

export const fetchStreakStats = async (currentUserId, setStreakStats) => {
  try {
    if (!currentUserId) return;
    const res = await fetch(`/api/users/${currentUserId}/streak-stats`);
    if (res.ok) {
      const data = await res.json();
      setStreakStats(data);
    }
  } catch (error) {
    console.error('Failed to fetch streak stats:', error);
  }
};
