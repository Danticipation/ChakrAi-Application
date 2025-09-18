import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  animate?: boolean;
}

export default function SettingsModal({ isOpen, onClose, animate }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            Ã—
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Notifications</span>
            <input type="checkbox" className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Dark Mode</span>
            <input type="checkbox" className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Sound Effects</span>
            <input type="checkbox" className="rounded" />
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
