'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletConnect } from './wallet-connect';
import { ThemeToggle } from './theme-toggle';
import { useWallet } from '@/lib/wallet-context';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ArrowLeftRight } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { network } = useWallet();

  const links = [
    { href: '/', label: 'Bridge', icon: ArrowLeftRight },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 backdrop-blur-xl"
      style={{ backgroundColor: 'rgba(var(--bg-primary-rgb, 9,9,11), 0.85)' }}
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Left: logo + nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">₿</span>
            </div>
            <span className="font-semibold text-sm hidden sm:block" style={{ color: 'var(--text-primary)' }}>
              sBTC Bridge
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                  pathname === href
                    ? 'bg-white/10 font-medium'
                    : 'hover:bg-white/5'
                )}
                style={{
                  color: pathname === href ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: network badge + theme toggle + wallet */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs px-2 py-1 rounded-lg font-medium hidden sm:block',
            network === 'mainnet'
              ? 'bg-orange-500/15 text-orange-400'
              : 'bg-blue-500/15 text-blue-400'
          )}>
            {network}
          </span>
          <ThemeToggle />
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
