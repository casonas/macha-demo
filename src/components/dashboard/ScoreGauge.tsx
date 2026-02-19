import React from 'react';

export default function ScoreGauge({ value }: { value: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
      <svg className="w-full h-full transform -rotate-90" style={{ filter: 'drop-shadow(0 6px 12px rgba(2,6,23,0.06))' }}>
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        {/* Background Ring - Light Gray */}
        <circle cx="64" cy="64" r={radius} stroke="#e6edf3" strokeWidth="10" fill="transparent" />
        {/* Progress Ring - Emerald Gradient */}
        <circle
          cx="64" cy="64" r={radius}
          stroke="url(#gaugeGradient)"
          strokeWidth="10"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.9s cubic-bezier(.2,.9,.2,1)' }}
          strokeLinecap="round" fill="transparent"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold text-slate-900">{Math.round(value)}%</span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Secure</span>
      </div>
    </div>
  );
}