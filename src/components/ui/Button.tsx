import type { ButtonHTMLAttributes } from 'react';

export default function Button({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`pointer-events-auto w-full rounded-lg border border-sky-400/30 bg-sky-500/20 px-4 py-2.5 text-left text-sm font-medium text-sky-100 transition hover:bg-sky-500/35 hover:border-sky-300/50 active:scale-[0.99] ${className}`}
    />
  );
}
