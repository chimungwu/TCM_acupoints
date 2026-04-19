import React from 'react';

export const Logo = ({ size = 40, className = "" }: { size?: number, className?: string }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 圓形代表氣的循環 */}
      <circle cx="50" cy="50" r="40" stroke="#4A7C59" strokeWidth="6" />
      {/* 針灸針 */}
      <line x1="25" y1="75" x2="75" y2="25" stroke="#C5A059" strokeWidth="8" strokeLinecap="round" />
      {/* 針柄 */}
      <circle cx="75" cy="25" r="6" fill="#C5A059" />
    </svg>
  );
};