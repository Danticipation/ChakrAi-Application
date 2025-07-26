//Ollama useAlarm.ts.
import React, { useState } from 'react';

export default function AlarmManager() {
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [alarmScheduled, setAlarmScheduled] = useState(false);

  const requestPermission = async () => {
    if (Notification.permission !== 'granted') {
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
    return true;
  };

  const scheduleAlarm = async () => {
    const granted = await requestPermission();
    if (!granted) {
      alert('Notification permission is required to schedule alarms.');
      return;
    }

    setTimeout(() => {
      new Notification('🧘 Chakrai Reminder', {
        body: 'It’s time for your reflection session. Tap to begin.',
        icon: '/icon.png',
        tag: 'chakrai-alarm',
      });
    }, delayMinutes * 60 * 1000);

    setAlarmScheduled(true);
  };

  return (
    <div className="theme-card p-4 border border-white/20 rounded-xl shadow">
      <h3 className="text-lg font-semibold text-white mb-2">Set Wellness Alarm</h3>
      <div className="flex items-center gap-4">
        <input
          type="number"
          min="1"
          max="1440"
          value={delayMinutes}
          onChange={(e) => setDelayMinutes(Number(e.target.value))}
          className="w-20 p-2 rounded bg-black text-white border border-white/20"
        />
        <span className="text-white">minutes from now</span>
      </div>
      <button
        onClick={scheduleAlarm}
        className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded shadow"
      >
        Set Alarm
      </button>

      {alarmScheduled && (
        <p className="text-sm text-green-400 mt-2">Alarm scheduled! You’ll be reminded in {delayMinutes} min.</p>
      )}
    </div>
  );
}
