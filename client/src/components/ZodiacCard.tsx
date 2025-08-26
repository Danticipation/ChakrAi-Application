import { motion } from "framer-motion";
import { ZodiacSign } from "../types/zodiac";

interface ZodiacCardProps {
  zodiac: ZodiacSign;
}

export function ZodiacCard({ zodiac }: ZodiacCardProps) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${zodiac.color} p-6 text-white shadow-lg cursor-pointer group`}
      whileHover={{ 
        scale: 1.05,
        rotateY: 5,
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Cosmic background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="text-3xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            {zodiac.emoji}
          </motion.div>
          <motion.div 
            className="text-2xl font-bold opacity-60"
            whileHover={{ scale: 1.2, opacity: 1 }}
          >
            {zodiac.symbol}
          </motion.div>
        </div>

        {/* Name and Element */}
        <motion.h3 
          className="text-xl font-bold mb-1"
          initial={{ opacity: 0.8 }}
          whileHover={{ opacity: 1 }}
        >
          {zodiac.name}
        </motion.h3>
        
        <motion.p 
          className="text-sm opacity-80 mb-2"
          whileHover={{ opacity: 1 }}
        >
          {zodiac.element} • {zodiac.dates}
        </motion.p>

        {/* Traits */}
        <motion.div 
          className="space-y-1"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {zodiac.traits.map((trait, index) => (
            <motion.div
              key={trait}
              className="text-xs bg-white/20 rounded-full px-2 py-1 inline-block mr-1"
              initial={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {trait}
            </motion.div>
          ))}
        </motion.div>

        {/* Hover overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        />
      </div>
    </motion.div>
  );
}