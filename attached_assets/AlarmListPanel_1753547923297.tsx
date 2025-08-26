//AlarmListPanel.tsx
import React, { useEffect, useState } from 'react';
import { getAllAlarms, deleteAlarm } from './alarmDB';

export default function AlarmListPanel() {
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    const loadAlarms = async () => {
      const items = await getAllAlarms();
      setAlarms(items);
    };
    loadAlarms();
  }, []);

  const handleDelete = async (id) => {
    await deleteAlarm(id);
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="theme-card p-4 border border-white/20 rounded-xl shadow mt-6">
      <h3 className="text-lg font-semibold text-white mb-4">Scheduled Alarms</h3>
      {alarms.length === 0 ? (
        <p className="text-white/60 text-sm">No alarms set</p>
      ) : (
        <ul className="space-y-2">
          {alarms.map((alarm) => (
            <li key={alarm.id} className="flex justify-between items-center bg-white/10 p-2 rounded">
              <span className="text-white text-sm">
                🔔 {alarm.label || 'Reminder'} —{' '}
                {new Date(alarm.triggerAt).toLocaleTimeString()}
              </span>
              <button
                onClick={() => handleDelete(alarm.id)}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                Cancel
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
