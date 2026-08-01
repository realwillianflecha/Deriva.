import type { ReactNode } from 'react';

export default function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-black/70 backdrop-blur-md shadow-xl shadow-black/40 ${className}`}
    >
      {children}
    </div>
  );
}
