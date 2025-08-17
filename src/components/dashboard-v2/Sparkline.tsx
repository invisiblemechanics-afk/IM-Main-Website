import React from 'react';

export default function Sparkline({ data, width=120, height=36 }: { data: number[]; width?: number; height?: number }) {
  if (!data || data.length === 0) return <div className="h-9 w-[120px] bg-zinc-800/40 rounded"/>;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const norm = (v: number) => {
    if (max === min) return height / 2;
    return height - ((v - min) / (max - min)) * height;
  };
  const step = width / Math.max(1, data.length - 1);
  const points = data.map((v, i) => `${i*step},${norm(v)}`).join(' ');
  return (
    <svg width={width} height={height} aria-hidden>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" opacity={0.9}/>
    </svg>
  );
}



