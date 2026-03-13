'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { Button } from '@/components/ui/button';
import { estimateFees, type FeeEstimate } from '@/lib/mock-sdk';
import { formatBTC, formatSats, formatUSD, estimatedTime } from '@/lib/utils';
import { ArrowDown } from 'lucide-react';

type Step = 'input' | 'confirm' | 'pending' | 'success';

export function WithdrawForm() {
  const { isConnected, btcAddress, network } = useWallet();
  const [amount, setAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [fees, setFees] = useState<FeeEstimate | null>(null);
  const [loadingFees, setLoadingFees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseFloat(amount) || 0;
  const amountSats = Math.round(amountNum * 1e8);
  const isValidAmount = amountNum >= 0.0001 && amountNum <= 1;
  const isValidAddress = destinationAddress.length > 25;

  useEffect(() => {
    if (btcAddress && !destinationAddress) setDestinationAddress(btcAddress);
  }, [btcAddress, destinationAddress]);

  useEffect(() => {
    if (!isValidAmount || !amount) { setFees(null); return; }
    const t = setTimeout(async () => {
      setLoadingFees(true);
      try {
        setFees(await estimateFees('withdraw', amountNum, network));
      } finally {
        setLoadingFees(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [amount, network, amountNum, isValidAmount]);

  useEffect(() => {
    if (step !== 'pending') return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setStep('success'); return 100; }
        return p + 10;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [step]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setStep('pending');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep('input'); setAmount(''); setFees(null); setProgress(0); setError(null);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">₿</span>
        </div>
        <p className="text-zinc-400 text-sm">Connect your wallet to withdraw sBTC</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">BTC Sent Successfully!</h3>
        <p className="text-zinc-400 text-sm mb-1">{formatBTC(amountSats)} sent to your Bitcoin address</p>
        <p className="text-zinc-600 text-xs font-mono mb-6 truncate px-4">{destinationAddress}</p>
        <Button onClick={reset} variant="secondary">Withdraw Again</Button>
      </div>
    );
  }

  if (step === 'pending') {
    return (
      <div className="py-6 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <span className="text-2xl">₿</span>
            <svg className="absolute inset-0 w-full h-full animate-spin" fill="none" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" stroke="rgb(168 85 247 / 0.2)" strokeWidth="2" />
              <path d="M32 4a28 28 0 0 1 28 28" stroke="rgb(168 85 247)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Processing Withdrawal</h3>
          <p className="text-zinc-400 text-sm mt-1">Burning sBTC and releasing BTC</p>
        </div>

        <div className="space-y-2">
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 text-right">{progress}%</p>
        </div>

        <div className="space-y-2">
          {[
            { label: 'Stacks transaction submitted', done: progress >= 20 },
            { label: 'sBTC burned on Stacks', done: progress >= 50 },
            { label: 'BTC released by signers', done: progress >= 100 },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                s.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/8 text-zinc-600'
              }`}>
                {s.done
                  ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M5 13l4 4L19 7" /></svg>
                  : <span className="text-xs">{i + 1}</span>
                }
              </div>
              <span className={s.done ? 'text-white' : 'text-zinc-500'}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-white">Confirm Withdrawal</h3>
        <div className="bg-white/5 rounded-xl divide-y divide-white/8">
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-zinc-400">sBTC amount</span>
            <span className="text-white font-medium">{formatBTC(amountSats)} sBTC</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-zinc-400">You will receive</span>
            <span className="text-orange-400 font-medium">{formatBTC(amountSats)} BTC</span>
          </div>
          {fees && (
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-zinc-400">Estimated fee</span>
              <span className="text-white">{formatSats(fees.bitcoinFeeSats)} ≈ {formatUSD(fees.estimatedUsd)}</span>
            </div>
          )}
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-zinc-400">Estimated time</span>
            <span className="text-white">{estimatedTime(6 * 10 * 60 * 1000)}</span>
          </div>
          <div className="px-4 py-3 text-sm">
            <p className="text-zinc-400 mb-1">Destination address</p>
            <p className="text-white font-mono text-xs break-all">{destinationAddress}</p>
          </div>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">{error}</div>
        )}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setStep('input')}>Back</Button>
          <Button className="flex-1" loading={submitting} onClick={handleConfirm}>Confirm</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">Amount (sBTC)</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            min="0.0001"
            max="1"
            step="0.0001"
            className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-4 py-4 text-2xl font-semibold text-white placeholder-zinc-600 outline-none transition-colors pr-20"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">sBTC</span>
        </div>
        {amountNum > 0 && !isValidAmount && (
          <p className="text-xs text-red-400 mt-1 ml-1">
            {amountNum < 0.0001 ? 'Minimum 0.0001 sBTC' : 'Maximum 1 sBTC per transaction'}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center">
        <div className="w-8 h-8 bg-white/8 rounded-full flex items-center justify-center">
          <ArrowDown className="w-4 h-4 text-zinc-400" />
        </div>
      </div>

      <div className="bg-white/5 border border-white/8 rounded-xl px-4 py-4">
        <p className="text-xs text-zinc-500 mb-1">You will receive</p>
        <p className="text-2xl font-semibold text-orange-400">
          {isValidAmount ? formatBTC(amountSats) : '0.00'} <span className="text-lg">BTC</span>
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">1:1 peg — no fees deducted</p>
      </div>

      <div>
        <label className="text-sm text-zinc-400 mb-2 block">Destination Bitcoin Address</label>
        <input
          type="text"
          value={destinationAddress}
          onChange={e => setDestinationAddress(e.target.value)}
          placeholder="bc1q... or tb1q..."
          className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors font-mono"
        />
      </div>

      {isValidAmount && fees && !loadingFees && (
        <div className="bg-white/3 rounded-xl p-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Estimated fee</span>
            <span className="text-white">{formatSats(fees.bitcoinFeeSats)} ≈ {formatUSD(fees.estimatedUsd)}</span>
          </div>
        </div>
      )}

      <Button className="w-full" size="lg" disabled={!isValidAmount || !isValidAddress} onClick={() => setStep('confirm')}>
        Review Withdrawal
      </Button>
    </div>
  );
}
