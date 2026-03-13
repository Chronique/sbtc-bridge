'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type WalletType = 'leather' | 'xverse' | null;

export interface WalletState {
  isConnected: boolean;
  walletType: WalletType;
  stacksAddress: string | null;
  btcAddress: string | null;
  network: 'mainnet' | 'testnet';
  connect: (type: WalletType) => Promise<void>;
  disconnect: () => void;
  toggleNetwork: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [btcAddress, setBtcAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('testnet');

  const connect = useCallback(async (type: WalletType) => {
    if (!type) return;

    try {
      // Leather wallet
      if (type === 'leather') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const provider = (window as any).LeatherProvider;
        if (!provider) {
          window.open('https://leather.io', '_blank');
          throw new Error('Leather wallet tidak terinstall');
        }
        const result = await provider.request('getAddresses');
        const addresses = result.result.addresses;
        const stx = addresses.find((a: { symbol: string }) => a.symbol === 'STX');
        const btc = addresses.find((a: { type: string }) => a.type === 'p2wpkh' || a.type === 'p2tr');
        setStacksAddress(stx?.address ?? null);
        setBtcAddress(btc?.address ?? null);
      }

      // Xverse wallet
      if (type === 'xverse') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const btcProvider = (window as any).XverseProviders?.BitcoinProvider;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stxProvider = (window as any).XverseProviders?.StacksProvider;
        if (!btcProvider) {
          window.open('https://www.xverse.app', '_blank');
          throw new Error('Xverse wallet tidak terinstall');
        }
        const [btcResult, stxResult] = await Promise.all([
          btcProvider.connect({ message: 'Connect to sBTC Bridge', purposes: ['payment', 'ordinals'] }),
          stxProvider?.connect({ message: 'Connect to sBTC Bridge' }),
        ]);
        const btc = btcResult.addresses.find((a: { purpose: string }) => a.purpose === 'payment');
        setBtcAddress(btc?.address ?? null);
        setStacksAddress(stxResult?.addresses?.[0]?.address ?? null);
      }

      setWalletType(type);
    } catch (err) {
      console.error('Connect error:', err);
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    setWalletType(null);
    setStacksAddress(null);
    setBtcAddress(null);
  }, []);

  const toggleNetwork = useCallback(() => {
    setNetwork(n => (n === 'mainnet' ? 'testnet' : 'mainnet'));
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!walletType,
        walletType,
        stacksAddress,
        btcAddress,
        network,
        connect,
        disconnect,
        toggleNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
