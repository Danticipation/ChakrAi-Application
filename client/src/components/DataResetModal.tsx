import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';

interface DataResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  resetType: 'journals' | 'chat' | 'factory' | null;
  onConfirm: () => void;
}

const DataResetModal: React.FC<DataResetModalProps> = ({ 
  isOpen, 
  onClose, 
  resetType,
  onConfirm
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !resetType) return null;

  const resetConfigs = {
    journals: {
      title: 'Clear All Journal Entries',
      icon: '📔',
      description: 'This will permanently delete all your journal entries.',
      items: ['All journal entries', 'Journal analytics', 'Journal tags'],
      confirmPhrase: 'clear journals',
      buttonText: 'Clear Journal Entries',
      color: 'orange'
    },
    chat: {
      title: 'Clear Chat History',
      icon: '💬',
      description: 'This will permanently delete all your chat messages.',
      items: ['All chat messages', 'Conversation history', 'AI responses'],
      confirmPhrase: 'clear chat',
      buttonText: 'Clear Chat History',
      color: 'purple'
    },
    factory: {
      title: 'Factory Reset',
      icon: '⚠️',
      description: 'This will permanently delete ALL your data and cannot be undone.',
      items: [
        'All journal entries',
        'All chat history',
        'All mood tracking data',
        'All memories and insights',
        'All learning progress',
        'All personal settings'
      ],
      confirmPhrase: 'DELETE ALL',
      buttonText: 'Factory Reset - Delete Everything',
      color: 'red'
    }
  };

  const config = resetConfigs[resetType];

  const handleConfirm = async () => {
    if (confirmText.toLowerCase() !== config.confirmPhrase.toLowerCase()) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm();
      setSuccess(true);
      setTimeout(() => {
        if (resetType === 'factory') {
          localStorage.clear();
          sessionStorage.clear();
          window.location.reload();
        } else {
          onClose();
          setSuccess(false);
          setConfirmText('');
        }
      }, 2000);
    } catch (error) {
      console.error('Error during reset:', error);
      setIsLoading(false);
    }
  };

  const bgColor = {
    orange: 'bg-orange-500/10 border-orange-500/50',
    purple: 'bg-purple-500/10 border-purple-500/50',
    red: 'bg-red-500/10 border-red-500/50'
  }[config.color];

  const buttonColor = {
    orange: 'bg-orange-600 hover:bg-orange-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    red: 'bg-red-600 hover:bg-red-700'
  }[config.color];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className={`theme-surface rounded-2xl shadow-2xl w-full max-w-md border-2 ${bgColor}`}>
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{config.icon}</span>
              <h2 className="text-xl font-bold theme-text">{config.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5 theme-text-secondary" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold theme-text mb-2">Success!</h3>
              <p className="theme-text-secondary">
                {resetType === 'factory' 
                  ? 'Factory reset complete. Reloading...' 
                  : 'Data has been cleared successfully.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="theme-text-secondary mb-4">{config.description}</p>
                
                {resetType === 'factory' && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                      <div className="text-sm text-red-300">
                        <strong>DANGER ZONE:</strong> This action cannot be reversed. 
                        Make sure you have exported your data if you want to keep a backup.
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-semibold theme-text mb-2">The following will be deleted:</p>
                  <ul className="space-y-1">
                    {config.items.map((item, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm theme-text-secondary">
                        <Trash2 className="w-3 h-3" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium theme-text mb-2">
                    Type <span className="font-bold text-white">{config.confirmPhrase}</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full px-4 py-2 bg-black/30 border border-white/30 rounded-lg theme-text focus:outline-none focus:border-white/50"
                    placeholder={`Type "${config.confirmPhrase}" here`}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 theme-text rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={confirmText.toLowerCase() !== config.confirmPhrase.toLowerCase() || isLoading}
                    className={`flex-1 px-4 py-2 ${buttonColor} text-white rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>{config.buttonText}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataResetModal;
