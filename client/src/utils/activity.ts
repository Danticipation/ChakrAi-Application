export const updateUserActivity = async (userId: number, activityType: string) => {
  try {
    if (!userId) return;

    await fetch('/api/users/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        activityType,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to update user activity:', error);
  }
};

export const recordAppVisit = async (userId: number) => {
  try {
    if (!userId) return;

    await fetch(`/api/users/${userId}/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ activityType: 'app_visit' })
    });
  } catch (error) {
    console.error('Failed to record app visit:', error);
  }
};
