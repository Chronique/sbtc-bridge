'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, Shield, Zap, Lock } from 'lucide-react';

const DepositForm = dynamic(
  () => import('@/components/bridge/deposit-form').then(m => ({ default: m.DepositForm })),
  { ssr: false, loading: () => <FormSkeleton /> }
);
const WithdrawForm = dynamic(
  () => import('@/components/bridge/withdraw-form').then(m => ({ default: m.WithdrawForm })),
  { ssr: false, loading: () => <FormSkeleton /> }
);

function FormSkeleton() {
  return (
    <div className="space-y-4 py-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

const TABS = [
  { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft, desc: 'BTC → sBTC' },
  { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight, desc: 'sBTC → BTC' },
] as const;

const FEATURES = [
  {
    icon: Shield,
    title: '1:1 Backed',
    desc: 'Every sBTC is fully backed by real BTC via the PoX mechanism',
  },
  {
    icon: Zap,
    title: 'Native Bridge',
    desc: 'Not a wrapped token — bridged natively through the Stacks protocol',
  },
  {
    icon: Lock,
    title: 'Non-custodial',
    desc: 'You always hold your private keys. No third party involved',
  },
];

export default function BridgePage() {
  const [activeTab, setActiveTab] = useState('deposit');

  return (
    <div className="relative flex flex-col items-center gap-10 pt-4">

      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-60 left-1/4 w-[300px] h-[300px] bg-purple-500/8 rounded-full blur-3xl" />
      </div>

      {/* Hero */}
      <div className="relative text-center max-w-xl px-4">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-sm text-orange-400 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Testnet active — try it before switching to mainnet
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
          Bridge{' '}
          <span className="text-orange-400">BTC</span>
          {' '}↔{' '}
          <span className="text-emerald-400">sBTC</span>
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          Deposit Bitcoin and receive sBTC on Stacks. Use it across DeFi —
          swap, lend, earn — then withdraw back to BTC anytime.
        </p>
      </div>

      {/* Bridge card */}
      <div className="relative w-full max-w-md px-4">
        <div className="bg-zinc-900/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-sm">

          {/* Tabs */}
          <div className="flex border-b border-white/8">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-orange-500 bg-orange-500/5'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/3'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-md font-mono',
                  activeTab === tab.id
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-white/5 text-zinc-600'
                )}>
                  {tab.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Form area */}
          <div className="p-6">
            {activeTab === 'deposit' ? <DepositForm /> : <WithdrawForm />}
          </div>
        </div>

        {/* Card glow */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      </div>

      {/* Feature pills */}
      <div className="relative w-full max-w-2xl px-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FEATURES.map(f => (
          <div
            key={f.title}
            className="flex gap-3 p-4 bg-zinc-900/60 border border-white/6 rounded-xl backdrop-blur-sm hover:border-white/12 transition-colors"
          >
            <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <f.icon className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom stats */}
      <div className="relative w-full max-w-2xl px-4 pb-4">
        <div className="flex items-center justify-center gap-8 py-4 border-t border-white/6">
          {[
            { label: 'Min deposit', value: '0.0001 BTC' },
            { label: 'Bridge time', value: '~20 min' },
            { label: 'Bridge fee', value: 'Network only' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-white font-semibold text-sm">{s.value}</p>
              <p className="text-zinc-600 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}