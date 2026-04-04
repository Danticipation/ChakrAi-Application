import React from "react";

const LuxuryBackdrop = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative rounded-3xl p-6 bg-gradient-to-br from-purple-800 via-indigo-900 to-black shadow-2xl overflow-hidden">
      {/* Constellations Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1),transparent)] animate-slow-spin pointer-events-none" />
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-30 animate-floating"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default LuxuryBackdrop;

