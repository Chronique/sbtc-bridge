// Real implementations using sbtc SDK
// Install: npm install sbtc @stacks/connect @stacks/transactions bitcoin-address-validation

import {
  SbtcApiClientMainnet,
  SbtcApiClientTestnet,
  buildSbtcDepositAddress,
  MAINNET,
  TESTNET,
} from 'sbtc';
import { request } from '@stacks/connect';
import { tupleCV, uintCV, bufferCV } from '@stacks/transactions';
import { validate, getAddressInfo, AddressType } from 'bitcoin-address-validation';
import { bech32, bech32m } from '@scure/base';
import bs58check from 'bs58check';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClient(network: 'mainnet' | 'testnet') {
  return network === 'mainnet'
    ? new SbtcApiClientMainnet()
    : new SbtcApiClientTestnet();
}

// ─── Fee Estimation ──────────────────────────────────────────────────────────

export async function estimateFees(
  operation: 'deposit' | 'withdraw',
  _amount: number,
  network: 'mainnet' | 'testnet'
): Promise<FeeEstimate> {
  const client = getClient(network);
  const feeRate = await client.fetchFeeRate('medium');
  const vbytes = operation === 'deposit' ? 250 : 180;
  const bitcoinFeeSats = Math.ceil(vbytes * feeRate);

  let btcPrice = 65000;
  try {
    const res = await fetch('https://mempool.space/api/v1/prices');
    const data = await res.json();
    btcPrice = data.USD ?? btcPrice;
  } catch {
    // fallback
  }

  return {
    bitcoinFeeSats,
    stacksFeeUstx: 2000,
    totalSats: bitcoinFeeSats,
    estimatedUsd: (bitcoinFeeSats / 1e8) * btcPrice,
    feeRate,
  };
}

// ─── Deposit (BTC → sBTC) ────────────────────────────────────────────────────
// buildSbtcDepositAddress requires: network, stacksAddress, signersPublicKey, reclaimPublicKey
// reclaimPublicKey = user's BTC public key (hex), so they can reclaim if signers don't process

export async function initiateDeposit(
  amountSats: number,
  stacksAddress: string,
  reclaimPublicKey: string,         // user's Bitcoin public key (hex) from wallet
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<DepositResult> {
  const client = getClient(network);

  const deposit = buildSbtcDepositAddress({
    stacksAddress,
    signersPublicKey: await client.fetchSignersPublicKey(),
    reclaimPublicKey,
    network: network === 'mainnet' ? MAINNET : TESTNET,
  });
  // deposit shape: { depositScript, reclaimScript, trOut, address }

  // Invoke wallet to sign & broadcast the Bitcoin tx (WBIP005)
  const response = await request('sendTransfer', {
    recipients: [{ address: deposit.address, amount: amountSats.toString() }],
    network,
  });

  const btcTxId: string = response.txid;

  // Wait for tx to appear in mempool before notifying signers
  await new Promise(r => setTimeout(r, 3000));

  // notifySbtc expects: { depositScript, reclaimScript, vout?, transaction }
  // 'transaction' here is the broadcasted tx id or raw hex
  await client.notifySbtc({
    depositScript: deposit.depositScript,
    reclaimScript: deposit.reclaimScript,
    transaction: btcTxId,
  });

  const feeRate = await client.fetchFeeRate('medium');

  return {
    btcTxId,
    amountSats,
    estimatedMintMs: 20 * 60 * 1000,
    feeSats: Math.ceil(250 * feeRate),
  };
}

// ─── Withdraw (sBTC → BTC) ───────────────────────────────────────────────────

// AddressType enum → Clarity uint version mapping
const ADDRESS_VERSION: Record<AddressType, number> = {
  [AddressType.p2pkh]:  0,
  [AddressType.p2sh]:   1,
  [AddressType.p2wpkh]: 2,
  [AddressType.p2wsh]:  3,
  [AddressType.p2tr]:   4,
};

// AddressInfo has: { bech32, network, address, type } — no .hash field
// Decode hashbytes manually based on address type
function decodeAddressHashbytes(address: string, isBech32: boolean): Buffer {
  if (isBech32) {
    try {
      const decoded = bech32m.decode(address as `${string}1${string}`);
      return Buffer.from(bech32m.fromWords(decoded.words.slice(1)));
    } catch {
      const decoded = bech32.decode(address as `${string}1${string}`);
      return Buffer.from(bech32.fromWords(decoded.words.slice(1)));
    }
  } else {
    const decoded = bs58check.decode(address);
    return Buffer.from(decoded.slice(1));
  }
}

export async function initiateWithdraw(
  amountSats: number,
  btcRecipientAddress: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<{ stacksTxId: string }> {
  if (!validate(btcRecipientAddress)) {
    throw new Error(`Invalid Bitcoin address: ${btcRecipientAddress}`);
  }

  // AddressInfo = { bech32: boolean, network, address, type }
  const addressInfo = getAddressInfo(btcRecipientAddress);
  const version = ADDRESS_VERSION[addressInfo.type];
  const hashbytes = decodeAddressHashbytes(btcRecipientAddress, addressInfo.bech32);

  const response = await request('stx_callContract', {
    contract: network === 'mainnet'
      ? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-withdrawal'
      : 'ST1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28G8HXK9G.sbtc-withdrawal',
    functionName: 'initiate-withdrawal-request',
    functionArgs: [
      uintCV(amountSats),
      tupleCV({
        version: uintCV(version),
        hashbytes: bufferCV(hashbytes),
      }),
      uintCV(80000),
    ],
    network,
  });

  if (!response.txid) {
    throw new Error('Wallet did not return a transaction ID');
  }

  return { stacksTxId: response.txid };
}

// ─── sBTC Balance ────────────────────────────────────────────────────────────

export async function getSbtcBalance(
  stacksAddress: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<BalanceResult> {
  const client = getClient(network);
  const sBTCSats = await client.fetchSbtcBalance(stacksAddress);

  return {
    sBTC: Number(sBTCSats) / 1e8,
    sBTCSats: BigInt(sBTCSats),
    btcSats: 0n,
  };
}

// ─── Deposit Status ──────────────────────────────────────────────────────────

export async function getDepositStatus(
  btcTxId: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<BridgeStatusResult> {
  const client = getClient(network);
  const deposit = await client.fetchDeposit(btcTxId);

  const statusMap: Record<string, BridgeStatusResult['status']> = {
    pending: 'pending',
    confirmed: 'confirmed',
    minted: 'minted',
    failed: 'failed',
  };

  return {
    status: statusMap[deposit.status] ?? 'pending',
    confirmations: (deposit as any).confirmations ?? 0,
    requiredConfirmations: 2,
    estimatedCompletion:
      deposit.status === 'pending'
        ? new Date(Date.now() + 20 * 60 * 1000)
        : undefined,
  };
}

// ─── Tx History ──────────────────────────────────────────────────────────────

export async function getTxHistory(
  stacksAddress: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<TxHistory[]> {
  const baseUrl =
    network === 'mainnet'
      ? 'https://api.mainnet.hiro.so'
      : 'https://api.testnet.hiro.so';

  const SBTC_CONTRACT =
    network === 'mainnet'
      ? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4'
      : 'ST1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28G8HXK9G';

  const res = await fetch(
    `${baseUrl}/extended/v1/address/${stacksAddress}/transactions?limit=20`
  );
  const data = await res.json();

  return (data.results ?? [])
    .filter((tx: any) => tx.contract_call?.contract_id?.startsWith(SBTC_CONTRACT))
    .map((tx: any): TxHistory => {
      const fnName: string = tx.contract_call?.function_name ?? '';
      const type: 'deposit' | 'withdraw' = fnName.includes('withdraw')
        ? 'withdraw'
        : 'deposit';

      const statusMap: Record<string, BridgeStatusResult['status']> = {
        success: type === 'deposit' ? 'minted' : 'withdrawn',
        pending: 'pending',
        abort_by_response: 'failed',
        abort_by_post_condition: 'failed',
      };

      return {
        id: tx.tx_id,
        type,
        amountSats: Number(
          tx.contract_call?.function_args?.[0]?.repr?.replace('u', '') ?? 0
        ),
        status: statusMap[tx.tx_status] ?? 'pending',
        timestamp: new Date(tx.burn_block_time_iso ?? Date.now()),
        txId: tx.tx_id,
      };
    });
}