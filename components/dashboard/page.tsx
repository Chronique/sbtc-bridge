'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { estimateFees, type FeeEstimate } from '@/lib/mock-sdk';
import { formatSats, formatUSD } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Activity } from 'lucide-react';

// Load these with ssr: false — they use browser-only crypto libs
const BalanceCards = dynamic(
  () => import('@/components/dashboard/balance-cards').then(m => ({ default: m.BalanceCards })),
  { ssr: false }
);
const TxHistory = dynamic(
  () => import('@/components/dashboard/tx-history').then(m => ({ default: m.TxHistory })),
  { ssr: false }
);

function FeeEstimator() {
  const { network } = useWallet();
  const [op, setOp] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('0.01');
  const [fees, setFees] = useState<FeeEstimate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try { setFees(await estimateFees(op, amt, network)); }
      finally { setLoading(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [op, amount, network]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-zinc-400" />
          <h2 className="font-semibold text-white">Fee Estimator</h2>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['deposit', 'withdraw'] as const).map(o => (
              <button key={o} onClick={() => setOp(o)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                  op === o
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-white/5 text-zinc-400 border border-white/8 hover:border-white/15'
                }`}>{o}</button>
            ))}
          </div>
          <div className="relative">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500/50 transition-colors pr-14"
              placeholder="0.01" step="0.001" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">BTC</span>
          </div>
          <div className="bg-white/4 rounded-xl p-4 space-y-2.5">
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-4 bg-white/8 rounded animate-pulse" />)}
              </div>
            ) : fees ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Bitcoin fee</span>
                  <span className="text-white">{formatSats(fees.bitcoinFeeSats)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Fee rate</span>
                  <span className="text-white">{fees.feeRate} sat/vbyte</span>
                </div>
                {op === 'withdraw' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Stacks fee</span>
                    <span className="text-white">{(fees.stacksFeeUstx / 1e6).toFixed(4)} STX</span>
                  </div>
                )}
                <div className="border-t border-white/8 pt-2 flex justify-between text-sm font-medium">
                  <span className="text-zinc-300">Total estimate</span>
                  <span className="text-white">{formatUSD(fees.estimatedUsd)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-500 text-center">Enter a BTC amount to estimate fees</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NetworkStatus() {
  const { network, toggleNetwork } = useWallet();
  const stats = {
    mainnet: { btcBlock: 837_421, stacksBlock: 141_823, signers: 15, uptime: '99.98%' },
    testnet: { btcBlock: 2_582_311, stacksBlock: 87_234, signers: 7, uptime: '99.71%' },
  }[network];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-400" />
            <h2 className="font-semibold text-white">Network Status</h2>
          </div>
          <button onClick={toggleNetwork}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
              network === 'mainnet'
                ? 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25'
                : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
            }`}>{network}</button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Bridge status</span>
            <Badge variant="success">Operational</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">BTC block</span>
            <span className="text-white font-mono">#{stats.btcBlock.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Stacks block</span>
            <span className="text-white font-mono">#{stats.stacksBlock.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Active signers</span>
            <span className="text-white">{stats.signers}/15</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">30d uptime</span>
            <span className="text-emerald-400">{stats.uptime}</span>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
              <span>Signer threshold</span>
              <span>{stats.signers}/15 online</span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(stats.signers / 15) * 100}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { isConnected } = useWallet();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-zinc-400 text-sm">
          {isConnected ? 'Your portfolio and bridge activity.' : 'Connect your wallet to view your portfolio.'}
        </p>
      </div>
      <BalanceCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FeeEstimator />
        <NetworkStatus />
      </div>
      <TxHistory />
    </div>
  );
}