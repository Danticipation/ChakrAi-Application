import React, { useState, useEffect } from 'react';

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'warn' | 'success';
}

interface DebugLogProps {
  isVisible: boolean;
  onToggle: () => void;
}

const DebugLog: React.FC<DebugLogProps> = ({ isVisible, onToggle }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Override console methods to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (message: string, type: 'info' | 'error' | 'warn' | 'success') => {
      const logEntry: LogEntry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString(),
        message,
        type
      };
      setLogs(prev => [...prev.slice(-19), logEntry]); // Keep last 20 logs
    };

    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('ðŸŽ¯') || message.includes('ðŸ“Š') || message.includes('ðŸ”´') || 
          message.includes('ðŸ›‘') || message.includes('âœ…') || message.includes('âŒ') ||
          message.includes('ðŸš€') || message.includes('transcrib') || message.includes('recording')) {
        addLog(message, 'info');
      }
      originalLog(...args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('ðŸš¨') || message.includes('âŒ') || 
          message.includes('transcrib') || message.includes('recording')) {
        addLog(message, 'error');
      }
      originalError(...args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('âš ï¸') || message.includes('transcrib') || message.includes('recording')) {
        addLog(message, 'warn');
      }
      originalWarn(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm shadow-lg"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-30 pointer-events-none">
      <div className="bg-gray-900/95 text-white rounded-lg max-w-sm h-[60vh] flex flex-col ml-auto pointer-events-auto backdrop-blur-sm border border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">Debug Log</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setLogs([])}
              className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
            >
              Clear
            </button>
            <button
              onClick={onToggle}
              className="bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {logs.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              No debug logs yet. Try using the voice recording feature.
            </div>
          ) : (
            logs.map(log => (
              <div 
                key={log.id} 
                className={`p-2 rounded text-xs font-mono ${
                  log.type === 'error' ? 'bg-red-900/30 text-red-300' :
                  log.type === 'warn' ? 'bg-yellow-900/30 text-yellow-300' :
                  log.type === 'success' ? 'bg-green-900/30 text-green-300' :
                  'bg-blue-900/30 text-blue-300'
                }`}
              >
                <div className="text-gray-400 mb-1">[{log.timestamp}]</div>
                <div className="break-all">{log.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugLog;
