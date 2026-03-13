'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { Button } from './ui/button';
import { truncateAddress } from '@/lib/utils';
import { Wallet, ChevronDown, LogOut, Copy, Check } from 'lucide-react';

export function WalletConnect() {
  const { isConnected, stacksAddress, btcAddress, connect, disconnect, network, toggleNetwork } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (type: 'leather' | 'xverse') => {
    setConnecting(type);
    setError(null);
    try {
      await connect(type);
      setShowModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
    } finally {
      setConnecting(null);
    }
  };

  const handleCopy = () => {
    if (stacksAddress) {
      navigator.clipboard.writeText(stacksAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected && stacksAddress) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(d => !d)}
          className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 rounded-xl px-3 py-2 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm text-white font-medium">{truncateAddress(stacksAddress)}</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-20 p-3">
              <div className="px-2 py-2 mb-2">
                <p className="text-xs text-zinc-500 mb-1">Stacks Address</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white font-mono truncate">{truncateAddress(stacksAddress, 12)}</p>
                  <button onClick={handleCopy} className="text-zinc-400 hover:text-white shrink-0">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {btcAddress && (
                  <>
                    <p className="text-xs text-zinc-500 mb-1 mt-3">Bitcoin Address</p>
                    <p className="text-sm text-white font-mono">{truncateAddress(btcAddress, 12)}</p>
                  </>
                )}
              </div>
              <div className="border-t border-white/8 pt-2 mt-2">
                <div className="flex items-center justify-between px-2 py-2">
                  <span className="text-sm text-zinc-400">Network</span>
                  <button
                    onClick={toggleNetwork}
                    className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                      network === 'mainnet' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {network}
                  </button>
                </div>
                <button
                  onClick={() => { disconnect(); setShowDropdown(false); }}
                  className="flex items-center gap-2 w-full px-2 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <Button onClick={() => setShowModal(true)} size="sm">
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Connect Wallet</h2>
            <p className="text-sm text-zinc-400 mb-6">Choose a wallet to connect to sBTC Bridge</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {[
                { id: 'leather', label: 'Leather', sub: 'Formerly Hiro Wallet', color: 'bg-amber-500', letter: 'L' },
                { id: 'xverse', label: 'Xverse', sub: 'Bitcoin & Stacks wallet', color: 'bg-purple-600', letter: 'X' },
              ].map(w => (
                <button
                  key={w.id}
                  onClick={() => handleConnect(w.id as 'leather' | 'xverse')}
                  disabled={!!connecting}
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 rounded-xl transition-all disabled:opacity-50"
                >
                  <div className={`w-10 h-10 ${w.color} rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                    {w.letter}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{w.label}</p>
                    <p className="text-xs text-zinc-500">{w.sub}</p>
                  </div>
                  {connecting === w.id && (
                    <svg className="animate-spin h-4 w-4 ml-auto text-zinc-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
