import { type ButtonHTMLAttributes } from 'react';

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        'bg-[#0f6b4f] text-white border-none rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer hover:bg-[#0c5940] transition-colors disabled:opacity-60 ' +
        className
      }
    />
  );
}
