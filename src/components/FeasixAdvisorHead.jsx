import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function FeasixAdvisorHead({ status = 'normal', size = 'md' }) {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  const visorColors = {
    normal: '#38F0E3',
    warning: '#FFB547',
    thinking: '#38F0E3'
  };

  const ringColors = {
    normal: '#38F0E3',
    warning: '#FFB547',
    thinking: '#38F0E3'
  };

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size])}>
      {/* Analyzing Ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid ${ringColors[status]}`,
          opacity: 0.3
        }}
        animate={status === 'thinking' ? {
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        } : {}}
        transition={{
          duration: 2,
          repeat: status === 'thinking' ? Infinity : 0,
          ease: "easeInOut"
        }}
      />

      {/* Robot Head */}
      <div className="relative w-full h-full">
        {/* Main Head Body */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-300 rounded-full shadow-lg" />

        {/* Head Shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full" />

        {/* Visor Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative rounded-full"
            style={{
              width: '70%',
              height: '35%',
              background: '#0F1115',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
            }}
            animate={status === 'thinking' ? {
              opacity: [1, 0.6, 1]
            } : {}}
            transition={{
              duration: 1.5,
              repeat: status === 'thinking' ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            {/* Visor Glow */}
            <div
              className="absolute inset-0 rounded-full blur-sm"
              style={{
                background: visorColors[status],
                opacity: 0.6
              }}
            />
            {/* Visor Line */}
            <div
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="rounded-full"
                style={{
                  width: '80%',
                  height: '40%',
                  background: visorColors[status],
                  boxShadow: `0 0 10px ${visorColors[status]}`
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Chest Indicator */}
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2">
          <div
            className="rounded-full"
            style={{
              width: size === 'sm' ? '4px' : size === 'md' ? '6px' : size === 'lg' ? '8px' : '10px',
              height: size === 'sm' ? '4px' : size === 'md' ? '6px' : size === 'lg' ? '8px' : '10px',
              background: visorColors[status],
              boxShadow: `0 0 6px ${visorColors[status]}`
            }}
          />
        </div>
      </div>
    </div>
  );
}