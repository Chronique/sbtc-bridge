'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { mockGetHistory, type TxHistory } from '@/lib/mock-sdk';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBTC, truncateAddress } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const STATUS_MAP: Record<TxHistory['status'], { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
  minted:       { variant: 'success', label: 'Minted' },
  withdrawn:    { variant: 'success', label: 'Withdrawn' },
  confirmed:    { variant: 'warning', label: 'Confirming' },
  pending:      { variant: 'warning', label: 'Pending' },
  burn_pending: { variant: 'info',    label: 'Burning' },
  failed:       { variant: 'error',   label: 'Failed' },
};

export function TxHistory() {
  const { isConnected } = useWallet();
  const [history, setHistory] = useState<TxHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected) return;
    setLoading(true);
    mockGetHistory().then(setHistory).finally(() => setLoading(false));
  }, [isConnected]);

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-white">Transaction History</h2>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <p className="text-sm text-zinc-500 text-center py-6">Connect your wallet to view history</p>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-6">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {history.map(tx => {
              const status = STATUS_MAP[tx.status];
              const isDeposit = tx.type === 'deposit';
              return (
                <div key={tx.id} className="flex items-center gap-4 p-3 bg-white/4 hover:bg-white/7 rounded-xl transition-colors cursor-pointer">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isDeposit ? 'bg-emerald-500/15' : 'bg-orange-500/15'
                  }`}>
                    {isDeposit
                      ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                      : <ArrowUpRight className="w-4 h-4 text-orange-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white capitalize">{tx.type}</p>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono truncate">{truncateAddress(tx.txId, 10)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${isDeposit ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {isDeposit ? '+' : '-'}{formatBTC(tx.amountSats)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {tx.timestamp.toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
