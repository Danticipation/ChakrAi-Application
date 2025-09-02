import React from 'react';

const TestLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-yellow-400">
      <div className="p-8 text-black text-6xl font-bold">
        SIMPLE TEST LAYOUT IS WORKING
      </div>
      <div className="p-4">
        <h1 className="text-2xl">If you see this yellow background, the build system works</h1>
        <p className="text-lg">This means we can proceed with the clean design transformation</p>
      </div>
    </div>
  );
};

export default TestLayout;
