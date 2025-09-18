import React from 'react';
import DataMigrationTool from './DataMigrationTool';

export default function Dashboard() {

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-6">Welcome to TrAI</h1>
      
      {/* Data Migration Tool */}
      <div className="mb-6">
        <DataMigrationTool />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

        {/* Other dashboard cards/buttons can go here */}
      </div>


    </div>
  );
}

