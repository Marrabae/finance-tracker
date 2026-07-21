import { type ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#e6e9e7] rounded-2xl ${className}`}>
      {children}
    </div>
  );
}
