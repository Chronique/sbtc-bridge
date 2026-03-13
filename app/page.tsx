'use client';

import { useState } from 'react';
import { DepositForm } from '@/components/bridge/deposit-form';
import { WithdrawForm } from '@/components/bridge/withdraw-form';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, Shield, Zap, Lock } from 'lucide-react';

const TABS = [
  { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft, desc: 'BTC → sBTC' },
  { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight, desc: 'sBTC → BTC' },
] as const;

const FEATURES = [
  { icon: Shield, title: '1:1 Backed', desc: 'Every sBTC is fully backed by real BTC via the PoX mechanism' },
  { icon: Zap, title: 'Native Bridge', desc: 'Not a wrapped token — bridged natively through the Stacks protocol' },
  { icon: Lock, title: 'Non-custodial', desc: 'You always hold your private keys. No third party involved' },
];

export default function BridgePage() {
  const [activeTab, setActiveTab] = useState('deposit');

  return (
    <div className="flex flex-col items-center gap-10">
      {/* Hero */}
      <div className="text-center max-w-lg">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-sm text-orange-400 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Testnet active — try it before switching to mainnet
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          Bridge BTC ↔ sBTC
        </h1>
        <p className="text-zinc-400 leading-relaxed">
          Deposit Bitcoin and receive sBTC on Stacks. Use it across DeFi — swap, lend, earn —
          then withdraw back to BTC anytime.
        </p>
      </div>

      {/* Bridge card */}
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-white/8">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-orange-500 bg-orange-500/5'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-md',
                  activeTab === tab.id ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-zinc-600'
                )}>
                  {tab.desc}
                </span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'deposit' ? <DepositForm /> : <WithdrawForm />}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {FEATURES.map(f => (
          <div key={f.title} className="flex gap-3 p-4 bg-zinc-900/50 border border-white/6 rounded-xl">
            <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center shrink-0">
              <f.icon className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white mb-0.5">{f.title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
