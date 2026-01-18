import React from 'react';
import type { AvatarConfig } from './AvatarCustomizer';

interface CompanionAvatarProps {
  avatar?: AvatarConfig;
  size?: number;
  className?: string;
}

const DEFAULT_AVATAR: AvatarConfig = {
  style: 'adventurer',
  seed: 'wellness1',
  backgroundColor: '#3b82f6'
};

const CompanionAvatar: React.FC<CompanionAvatarProps> = ({ 
  avatar = DEFAULT_AVATAR, 
  size = 40,
  className = ''
}) => {
  const getAvatarUrl = () => {
    const config = avatar || DEFAULT_AVATAR;
    return `https://api.dicebear.com/7.x/${config.style}/svg?seed=${config.seed}&size=${size * 2}`;
  };

  return (
    <div 
      className={`rounded-full overflow-hidden flex items-center justify-center ${className}`}
      style={{ 
        width: size, 
        height: size,
        backgroundColor: avatar?.backgroundColor || DEFAULT_AVATAR.backgroundColor
      }}
    >
      <img 
        src={getAvatarUrl()}
        alt="Wellness Companion"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default CompanionAvatar;
