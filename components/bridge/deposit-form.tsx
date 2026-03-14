'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { Button } from '@/components/ui/button';
import { estimateFees, initiateDeposit, type FeeEstimate } from '@/lib/mock-sdk';
import { formatBTC, formatSats, formatUSD, estimatedTime } from '@/lib/utils';
import { ArrowDown, Info } from 'lucide-react';

type Step = 'input' | 'confirm' | 'pending' | 'success';

export function DepositForm() {
  const { isConnected, network, stacksAddress } = useWallet();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [fees, setFees] = useState<FeeEstimate | null>(null);
  const [loadingFees, setLoadingFees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [confirmations, setConfirmations] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseFloat(amount) || 0;
  const amountSats = Math.round(amountNum * 1e8);
  const isValidAmount = amountNum >= 0.0001 && amountNum <= 1;

  useEffect(() => {
    if (!isValidAmount || !amount) { setFees(null); return; }
    const t = setTimeout(async () => {
      setLoadingFees(true);
      try {
        const f = await estimateFees('deposit', amountNum, network);
        setFees(f);
      } finally {
        setLoadingFees(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [amount, network, amountNum, isValidAmount]);

  useEffect(() => {
    if (step !== 'pending') return;
    const interval = setInterval(() => {
      setConfirmations(c => {
        if (c >= 6) { clearInterval(interval); setStep('success'); return c; }
        return c + 1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [step]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await initiateDeposit(
      amountSats,
      stacksAddress ?? '',
      '',      
      network
    );
      
      setTxId(result.btcTxId);
      setStep('pending');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep('input'); setAmount(''); setFees(null);
    setTxId(null); setConfirmations(0); setError(null);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">₿</span>
        </div>
        <p className="text-zinc-400 text-sm">Connect your wallet to start depositing</p>
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
        <h3 className="text-xl font-semibold text-white mb-2">sBTC Minted Successfully!</h3>
        <p className="text-zinc-400 text-sm mb-1">{formatBTC(amountSats)} is now available on Stacks</p>
        <p className="text-zinc-600 text-xs font-mono mb-6 truncate px-4">{txId}</p>
        <Button onClick={reset} variant="secondary" size="md">Deposit Again</Button>
      </div>
    );
  }

  if (step === 'pending') {
    return (
      <div className="py-6 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <span className="text-2xl">₿</span>
            <svg className="absolute inset-0 w-full h-full animate-spin" fill="none" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" stroke="rgb(249 115 22 / 0.3)" strokeWidth="2" />
              <path d="M32 4a28 28 0 0 1 28 28" stroke="rgb(249 115 22)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Waiting for Bitcoin Confirmations</h3>
          <p className="text-zinc-400 text-sm mt-1">{confirmations}/6 confirmations</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Progress</span>
            <span>{confirmations}/6</span>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700"
              style={{ width: `${(confirmations / 6) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {[
            { label: 'Bitcoin transaction broadcast', done: true },
            { label: '6 Bitcoin confirmations', done: confirmations >= 6 },
            { label: 'sBTC minted on Stacks', done: false },
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

        <div className="bg-white/5 rounded-xl p-3 text-xs text-zinc-500 font-mono truncate">
          TX: {txId}
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-white">Confirm Deposit</h3>
        <div className="bg-white/5 rounded-xl divide-y divide-white/8">
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-zinc-400">Amount</span>
            <span className="text-white font-medium">{formatBTC(amountSats)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-zinc-400">You will receive</span>
            <span className="text-emerald-400 font-medium">{formatBTC(amountSats)} sBTC</span>
          </div>
          {fees && (
            <>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-zinc-400">Network fee</span>
                <span className="text-white">{formatSats(fees.bitcoinFeeSats)} ({formatUSD(fees.estimatedUsd)})</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-zinc-400">Fee rate</span>
                <span className="text-white">{fees.feeRate} sat/vbyte</span>
              </div>
            </>
          )}
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-zinc-400">Estimated time</span>
            <span className="text-white">{estimatedTime(6 * 10 * 60 * 1000)}</span>
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
        <label className="text-sm text-zinc-400 mb-2 block">Amount (BTC)</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            min="0.0001"
            max="1"
            step="0.0001"
            className="w-full bg-white/5 border border-white/10 focus:border-orange-500/60 rounded-xl px-4 py-4 text-2xl font-semibold text-white placeholder-zinc-600 outline-none transition-colors pr-16"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">BTC</span>
        </div>
        {amountNum > 0 && <p className="text-xs text-zinc-500 mt-1 ml-1">{formatSats(amountSats)}</p>}
        {amountNum > 0 && !isValidAmount && (
          <p className="text-xs text-red-400 mt-1 ml-1">
            {amountNum < 0.0001 ? 'Minimum 0.0001 BTC (10,000 sats)' : 'Maximum 1 BTC per transaction'}
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
        <p className="text-2xl font-semibold text-emerald-400">
          {isValidAmount ? formatBTC(amountSats) : '0.00'} <span className="text-lg">sBTC</span>
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">1:1 peg with BTC — no fees deducted</p>
      </div>

      {isValidAmount && (
        <div className="bg-white/3 rounded-xl p-4 space-y-2">
          {loadingFees ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Estimating fees...
            </div>
          ) : fees ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Network fee</span>
                <span className="text-white">{formatSats(fees.bitcoinFeeSats)} ≈ {formatUSD(fees.estimatedUsd)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Estimated time</span>
                <span className="text-white">~60 min</span>
              </div>
            </>
          ) : null}
        </div>
      )}

      <Button className="w-full" size="lg" disabled={!isValidAmount} onClick={() => setStep('confirm')}>
        Review Deposit
      </Button>

      <p className="text-center text-xs text-zinc-600">
        sBTC is 1:1 backed by BTC via the Stacks PoX mechanism
      </p>
    </div>
  );
}
