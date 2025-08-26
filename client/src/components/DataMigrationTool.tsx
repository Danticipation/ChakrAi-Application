import React, { useState } from 'react';

interface OrphanedUserData {
  userId: string;
  messages: number;
  journalEntries: number;
  moodEntries: number;
}

interface OrphanedDataResponse {
  currentUserId: string;
  totalOrphanedUsers: number;
  orphanedData: OrphanedUserData[];
}

const DataMigrationTool = () => {
  const [orphanedData, setOrphanedData] = useState<OrphanedDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findOrphanedData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/data-migration/find-orphaned-data', {
        headers: {
          'x-device-fingerprint': 'healthcare-user-107'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setOrphanedData(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const migrateUserData = async (fromUserId: string) => {
    try {
      const response = await fetch(`/api/data-migration/migrate-user-data/${fromUserId}`, {
        method: 'POST',
        headers: {
          'x-device-fingerprint': 'healthcare-user-107'
        }
      });
      
      const result = await response.json();
      alert(`Migration result: ${result.message}`);
      
      // Refresh orphaned data
      findOrphanedData();
    } catch (err) {
      if (err instanceof Error) {
        alert(`Migration failed: ${err.message}`);
      } else {
        alert('Migration failed: An unknown error occurred');
      }
    }
  };

  return (
    <div className="p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl mb-6">
      <h2 className="text-xl font-bold mb-4 text-white">🔄 Data Migration Tool</h2>
      
      <button 
        onClick={findOrphanedData}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 transition-all"
      >
        {loading ? 'Searching...' : 'Find My Orphaned Data'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-500/20 text-red-200 rounded border border-red-400/30">
          Error: {error}
        </div>
      )}
      
      {orphanedData && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2 text-white">Current User ID: {orphanedData.currentUserId}</h3>
          
          {orphanedData.orphanedData.length === 0 ? (
            <p className="text-green-400">No orphaned data found!</p>
          ) : (
            <div>
              <p className="mb-2 text-white/80">Found {orphanedData.totalOrphanedUsers} user(s) with your data:</p>
              
              {orphanedData.orphanedData.map((user) => (
                <div key={user.userId} className="border border-white/20 p-3 mb-2 rounded bg-white/5">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong className="text-white">User ID {user.userId}:</strong>
                      <ul className="text-sm text-white/70">
                        <li>{user.messages} messages</li>
                        <li>{user.journalEntries} journal entries</li>
                        <li>{user.moodEntries} mood entries</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => migrateUserData(user.userId)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                    >
                      Migrate to Me
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataMigrationTool;
