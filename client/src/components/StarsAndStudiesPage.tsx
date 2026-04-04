import { motion } from "framer-motion";
import { ZodiacCard } from "./ZodiacCard";
import { zodiacSigns } from "../types/zodiac";

interface StarsAndStudiesPageProps {
  onBack: () => void;
}

export default function StarsAndStudiesPage({ onBack }: StarsAndStudiesPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 relative overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Cosmic gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.h1 
            className="text-4xl font-bold text-white mb-4"
            animate={{ 
              textShadow: [
                "0 0 10px rgba(147, 197, 253, 0.5)",
                "0 0 20px rgba(147, 197, 253, 0.8)",
                "0 0 10px rgba(147, 197, 253, 0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            âœ¨ Cosmic Horoscope Dashboard
          </motion.h1>
          <p className="text-lg text-blue-200/80 max-w-2xl mx-auto">
            Discover the cosmic insights of each zodiac sign. Hover over the cards to explore 
            their unique traits, elements, and celestial influences in this starlit journey.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {zodiacSigns.map((zodiac, index) => (
            <motion.div
              key={zodiac.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
            >
              <ZodiacCard zodiac={zodiac} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center mt-12 p-6 bg-gradient-to-r from-slate-800/50 via-blue-900/30 to-slate-800/50 rounded-lg border border-blue-700/30 shadow-xl backdrop-blur-sm"
        >
          <h2 className="text-lg font-semibold text-white mb-2">
            ðŸŒŸ Your Cosmic Journey Awaits
          </h2>
          <p className="text-blue-200/70">
            Each zodiac sign carries unique energies and characteristics. 
            Explore the mystical connections between the stars and discover your celestial destiny.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
