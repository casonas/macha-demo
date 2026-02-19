import React from 'react';

interface KpiProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  color?: string; // <--- ADD THIS LINE
  children?: React.ReactNode;
}

export default function KpiCard({ title, value, subtitle, trend, color, children }: KpiProps) {
  const isMacha = color === 'macha';

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md ${isMacha ? 'bg-white' : 'bg-white'}`}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: isMacha ? 'linear-gradient(180deg,#bbf7d0,#10b981)' : 'linear-gradient(180deg,#eef2ff,#e9f5ff)' }} />
      <div className="relative p-8 lg:p-10 text-center">
        <div className="mb-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${isMacha ? 'text-emerald-600' : 'text-slate-500'}`}>
              {title}
            </p>
            <h3 className="text-5xl lg:text-6xl font-extrabold text-slate-900 mt-2 leading-tight">{value}</h3>
          </div>
          {trend && (
            <span className="inline-block px-3 py-1 bg-transparent text-slate-500 text-xs font-medium rounded-full whitespace-nowrap mt-2">
              {trend}
            </span>
          )}
        </div>
        {children && <div className="py-6 flex justify-center">{children}</div>}
        {subtitle && <p className="text-sm text-slate-500 mt-4 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}