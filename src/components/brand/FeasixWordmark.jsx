import React from 'react';

export default function FeasixWordmark({ className = "text-2xl", showIcon = false }) {
  return (
    <div className="flex items-center gap-2">
      {showIcon && (
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
        >
          <rect x="6" y="6" width="12" height="2" rx="1" fill="currentColor" className="text-teal-400" />
          <rect x="8" y="11" width="8" height="2" rx="1" fill="currentColor" className="text-teal-400" />
          <rect x="10" y="16" width="4" height="2" rx="1" fill="currentColor" className="text-teal-400" />
        </svg>
      )}
      <span className={`font-semibold ${className}`}>
        <span className="text-zinc-100">Feasi</span>
        <span className="text-white">x</span>
      </span>
    </div>
  );
}