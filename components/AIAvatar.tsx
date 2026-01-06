"use client";
import React, { use, useState } from 'react';
import Image from 'next/image';
interface AIAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ isSpeaking, isListening }) => {
  const [isInteracting, setIsInteracting] = useState(false);

  const handleInteraction = () => {
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 800);
  };

  return (
    <div 
      className="absolute inset-0 z-0 overflow-hidden bg-gray-900 cursor-pointer"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* Background Image: Wanita Muslimah Profesional (Representasi BAI) */}
      <img 
        src="/avatar.png" 
        alt="Bawaslu AI Assistant Background" 
        className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${
          isSpeaking 
            ? 'animate-gentle-sway scale-[1.08] filter brightness-110' 
            : 'scale-100 filter brightness-100'
        } ${isInteracting ? 'brightness-125 transition-none' : ''}`}
      />
      
      {/* Overlay Gelap/Gradien */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${
        isSpeaking ? 'bg-gradient-to-b from-white/10 via-transparent to-black/80 opacity-100' : 'bg-gradient-to-b from-white/20 via-transparent to-black/70 opacity-100'
      }`} />
      
      {/* Efek Kilauan (Shimmer) saat interaksi */}
      <div className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full transition-transform duration-700 pointer-events-none ${
        isInteracting ? 'translate-x-full' : ''
      }`} />

      {/* Aura halus saat sedang berbicara */}
      {isSpeaking && (
        <div className="absolute inset-0 bg-orange-500/10 animate-pulse-slow pointer-events-none" />
      )}

      {/* Efek saat mendengarkan */}
      {isListening && (
        <div className="absolute inset-0 border-[16px] border-orange-500/20 animate-pulse pointer-events-none" />
      )}

      {/* Glow Oranye saat interaksi */}
      <div className={`absolute inset-0 bg-orange-500/10 transition-opacity duration-500 pointer-events-none ${
        isInteracting ? 'opacity-100' : 'opacity-0'
      }`} />

      {/* Gaya CSS untuk Animasi */}
      <style>{`
        @keyframes gentleSway {
          0% {
            transform: scale(1.08) rotate(0deg) translateY(0px);
          }
          25% {
            transform: scale(1.085) rotate(0.2deg) translateY(-2px);
          }
          50% {
            transform: scale(1.09) rotate(-0.1deg) translateY(1px);
          }
          75% {
            transform: scale(1.085) rotate(-0.3deg) translateY(-1px);
          }
          100% {
            transform: scale(1.08) rotate(0deg) translateY(0px);
          }
        }

        @keyframes pulseSlow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }

        .animate-gentle-sway {
          animation: gentleSway 10s infinite ease-in-out;
        }

        .animate-pulse-slow {
          animation: pulseSlow 5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AIAvatar;
