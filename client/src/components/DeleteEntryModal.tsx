import React from 'react';
import { Trash2, X } from 'lucide-react';

interface DeleteEntryModalProps {
  isOpen: boolean;
  entryId: number;
  entryTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteEntryModal({ isOpen, entryId, entryTitle, onConfirm, onCancel }: DeleteEntryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Delete Journal Entry
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            Are you sure you want to delete this journal entry?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            "{entryTitle || 'Untitled Entry'}"
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            This action cannot be undone.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Delete Entry</span>
          </button>
        </div>
      </div>
    </div>
  );
}
