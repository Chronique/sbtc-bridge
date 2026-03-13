import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBTC(sats: number): string {
  return (sats / 1e8).toFixed(8).replace(/\.?0+$/, '') + ' BTC';
}

export function formatSats(sats: number): string {
  return sats.toLocaleString() + ' sats';
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function truncateAddress(address: string, chars = 8): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-4)}`;
}

export function estimatedTime(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `~${mins} min`;
  return `~${Math.round(mins / 60)} hr`;
}
