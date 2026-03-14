'use client';

import { useTheme } from '@/lib/theme-context';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
    >
      {theme === 'dark'
        ? <Sun className="w-4 h-4 text-zinc-400 hover:text-amber-400 transition-colors" />
        : <Moon className="w-4 h-4 text-zinc-500 hover:text-blue-500 transition-colors" />
      }
    </button>
  );
}
