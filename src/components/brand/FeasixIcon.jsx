import React from 'react';

export default function FeasixIcon({ className = "w-6 h-6" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Flattened funnel - 3 simple lines */}
      <rect x="6" y="6" width="12" height="2" rx="1" fill="currentColor" className="text-teal-400" />
      <rect x="8" y="11" width="8" height="2" rx="1" fill="currentColor" className="text-teal-400" />
      <rect x="10" y="16" width="4" height="2" rx="1" fill="currentColor" className="text-teal-400" />
    </svg>
  );
}