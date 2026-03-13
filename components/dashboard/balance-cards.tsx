'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { mockGetBalance, type BalanceResult } from '@/lib/mock-sdk';
import { Card } from '@/components/ui/card';
import { TrendingUp, RefreshCw } from 'lucide-react';

const BTC_PRICE_USD = 65000;

export function BalanceCards() {
  const { isConnected } = useWallet();
  const [balance, setBalance] = useState<BalanceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBalance = async () => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const b = await mockGetBalance();
      setBalance(b);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBalance(); }, [isConnected]); // eslint-disable-line

  if (!isConnected) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {['sBTC Balance', 'BTC Balance'].map(label => (
          <Card key={label} className="p-6">
            <p className="text-sm text-zinc-500 mb-2">{label}</p>
            <p className="text-2xl font-bold text-zinc-700">—</p>
          </Card>
        ))}
      </div>
    );
  }

  const sbtcUsd = balance ? balance.sBTC * BTC_PRICE_USD : 0;
  const btcUsd = balance ? (Number(balance.btcSats) / 1e8) * BTC_PRICE_USD : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">Portfolio</h2>
        <button
          onClick={fetchBalance}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <span className="text-emerald-400 text-sm font-bold">S</span>
              </div>
              <span className="text-sm text-zinc-400">sBTC</span>
            </div>
            {loading ? (
              <div className="h-7 w-24 bg-white/8 rounded-lg animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-white">{balance ? balance.sBTC.toFixed(6) : '0.000000'}</p>
            )}
            <p className="text-sm text-zinc-500 mt-1">≈ ${sbtcUsd.toFixed(2)}</p>
          </div>
        </Card>

        <Card className="p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <span className="text-orange-400 text-sm font-bold">₿</span>
              </div>
              <span className="text-sm text-zinc-400">BTC</span>
            </div>
            {loading ? (
              <div className="h-7 w-24 bg-white/8 rounded-lg animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-white">{balance ? (Number(balance.btcSats) / 1e8).toFixed(6) : '0.000000'}</p>
            )}
            <p className="text-sm text-zinc-500 mt-1">≈ ${btcUsd.toFixed(2)}</p>
          </div>
        </Card>
      </div>

      {balance && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">Total portfolio</span>
            </div>
            <p className="text-sm font-semibold text-white">
              ${(sbtcUsd + btcUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
