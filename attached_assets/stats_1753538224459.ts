//utils/stats
import { getCurrentUserId } from '@/utils/userSession';

export const fetchStreakStats = async (userId, setStreakStats) => {
  try {
    if (!userId) return;
    const response = await fetch(`/api/users/${userId}/streak-stats`);
    if (response.ok) {
      const data = await response.json();
      setStreakStats(data);
    }
  } catch (error) {
    console.error('Failed to fetch streak stats:', error);
  }
};

export const clearAllUserData = async (queryClient, setMessages) => {
  if (confirm('This will clear ALL your data (messages, journal entries, mood tracking, etc.) and give you a fresh start. Are you sure?')) {
    try {
      const currentDeviceFingerprint = localStorage.getItem('deviceFingerprint');

      if (currentDeviceFingerprint) {
        const response = await fetch('/clear-user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceFingerprint: currentDeviceFingerprint })
        });

        if (!response.ok) throw new Error('Failed to clear server data');
      }

      localStorage.clear();
      queryClient.clear();

      const fingerprint = [
        navigator.userAgent,
        `${screen.width}x${screen.height}`,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language,
        navigator.platform,
        Date.now()
      ].join('');

      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
        hash |= 0;
      }

      const newDeviceId = Math.abs(hash).toString(36);
      localStorage.setItem('deviceFingerprint', newDeviceId);
      localStorage.setItem('freshStart', 'true');
      localStorage.setItem('freshStartTime', Date.now().toString());

      setMessages([]);
      alert('All data cleared successfully! Starting fresh...');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Error clearing data. Please try again.');
    }
  }
};
