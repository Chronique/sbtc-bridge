// Mock implementations for UI development
// Replace with real sbtc-sdk calls in production

export interface FeeEstimate {
  bitcoinFeeSats: number;
  stacksFeeUstx: number;
  totalSats: number;
  estimatedUsd: number;
  feeRate: number;
}

export interface DepositResult {
  btcTxId: string;
  amountSats: number;
  estimatedMintMs: number;
  feeSats: number;
}

export interface BridgeStatusResult {
  status: 'pending' | 'confirmed' | 'minted' | 'burn_pending' | 'withdrawn' | 'failed';
  confirmations: number;
  requiredConfirmations: number;
  estimatedCompletion?: Date;
}

export interface BalanceResult {
  sBTC: number;
  sBTCSats: bigint;
  btcSats: bigint;
}

export interface TxHistory {
  id: string;
  type: 'deposit' | 'withdraw';
  amountSats: number;
  status: BridgeStatusResult['status'];
  timestamp: Date;
  txId: string;
}

// Simulated fee estimation
export async function estimateFees(
  operation: 'deposit' | 'withdraw',
  amount: number,
  network: 'mainnet' | 'testnet'
): Promise<FeeEstimate> {
  await delay(600);
  const feeRate = network === 'mainnet' ? 18 : 5;
  const vbytes = operation === 'deposit' ? 250 : 180;
  const bitcoinFeeSats = Math.ceil(vbytes * feeRate);
  const btcPrice = 65000;
  return {
    bitcoinFeeSats,
    stacksFeeUstx: 2000,
    totalSats: bitcoinFeeSats,
    estimatedUsd: (bitcoinFeeSats / 1e8) * btcPrice,
    feeRate,
  };
}

// Simulated deposit
export async function mockDeposit(amount: number): Promise<DepositResult> {
  await delay(1500);
  return {
    btcTxId: `btctx_${Math.random().toString(36).slice(2, 12)}`,
    amountSats: Math.round(amount * 1e8),
    estimatedMintMs: 6 * 10 * 60 * 1000,
    feeSats: 4500,
  };
}

// Simulated balance
export async function mockGetBalance(): Promise<BalanceResult> {
  await delay(800);
  return {
    sBTC: 0.00342,
    sBTCSats: 342000n,
    btcSats: 1250000n,
  };
}

// Simulated tx history
export async function mockGetHistory(): Promise<TxHistory[]> {
  await delay(700);
  return [
    {
      id: '1',
      type: 'deposit',
      amountSats: 100000,
      status: 'minted',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      txId: 'btctx_abc123def456',
    },
    {
      id: '2',
      type: 'withdraw',
      amountSats: 50000,
      status: 'withdrawn',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      txId: '0xstacks_789xyz',
    },
    {
      id: '3',
      type: 'deposit',
      amountSats: 200000,
      status: 'confirmed',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      txId: 'btctx_pending456',
    },
  ];
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
