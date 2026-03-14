// Real sBTC SDK implementation with lazy imports
// All crypto libs loaded dynamically inside functions — never at module top-level
// This prevents Turbopack/Next.js SSR from crashing on browser-only packages

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

// ─── Fee Estimation ──────────────────────────────────────────────────────────

export async function estimateFees(
  operation: 'deposit' | 'withdraw',
  _amount: number,
  network: 'mainnet' | 'testnet'
): Promise<FeeEstimate> {
  // Lazy import — only loaded when this function is actually called in browser
  const { SbtcApiClientMainnet, SbtcApiClientTestnet } = await import('sbtc');

  const client = network === 'mainnet'
    ? new SbtcApiClientMainnet()
    : new SbtcApiClientTestnet();

  const feeRate = await client.fetchFeeRate('medium');
  const vbytes = operation === 'deposit' ? 250 : 180;
  const bitcoinFeeSats = Math.ceil(vbytes * feeRate);

  let btcPrice = 65000;
  try {
    const res = await fetch('https://mempool.space/api/v1/prices');
    const data = await res.json();
    btcPrice = data.USD ?? btcPrice;
  } catch {
    // fallback price
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

export async function initiateDeposit(
  amountSats: number,
  stacksAddress: string,
  reclaimPublicKey: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<DepositResult> {
  const { SbtcApiClientMainnet, SbtcApiClientTestnet, buildSbtcDepositAddress, MAINNET, TESTNET } =
    await import('sbtc');
  const { request } = await import('@stacks/connect');

  const client = network === 'mainnet'
    ? new SbtcApiClientMainnet()
    : new SbtcApiClientTestnet();

  const deposit = buildSbtcDepositAddress({
    stacksAddress,
    signersPublicKey: await client.fetchSignersPublicKey(),
    reclaimPublicKey,
    network: network === 'mainnet' ? MAINNET : TESTNET,
  });

  const response = await request('sendTransfer', {
    recipients: [{ address: deposit.address, amount: amountSats.toString() }],
    network,
  });

  const btcTxId: string = (response as { txid: string }).txid;

  await new Promise(r => setTimeout(r, 3000));

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

export async function initiateWithdraw(
  amountSats: number,
  btcRecipientAddress: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<{ stacksTxId: string }> {
  const { validate, getAddressInfo, AddressType } = await import('bitcoin-address-validation');
  const { tupleCV, uintCV, bufferCV } = await import('@stacks/transactions');
  const { request } = await import('@stacks/connect');
  const { bech32, bech32m } = await import('@scure/base');
  const bs58check = await import('bs58check');

  if (!validate(btcRecipientAddress)) {
    throw new Error(`Invalid Bitcoin address: ${btcRecipientAddress}`);
  }

  const ADDRESS_VERSION: Record<string, number> = {
    [AddressType.p2pkh]:  0,
    [AddressType.p2sh]:   1,
    [AddressType.p2wpkh]: 2,
    [AddressType.p2wsh]:  3,
    [AddressType.p2tr]:   4,
  };

  function decodeHashbytes(address: string, isBech32: boolean): Buffer {
    if (isBech32) {
      try {
        const decoded = bech32m.decode(address as `${string}1${string}`);
        return Buffer.from(bech32m.fromWords(decoded.words.slice(1)));
      } catch {
        const decoded = bech32.decode(address as `${string}1${string}`);
        return Buffer.from(bech32.fromWords(decoded.words.slice(1)));
      }
    } else {
      const decoded = bs58check.default.decode(address);
      return Buffer.from(decoded.slice(1));
    }
  }

  const addressInfo = getAddressInfo(btcRecipientAddress);
  const version = ADDRESS_VERSION[addressInfo.type];
  const hashbytes = decodeHashbytes(btcRecipientAddress, addressInfo.bech32);

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
  }) as { txid?: string };

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
  const { SbtcApiClientMainnet, SbtcApiClientTestnet } = await import('sbtc');

  const client = network === 'mainnet'
    ? new SbtcApiClientMainnet()
    : new SbtcApiClientTestnet();

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
  const { SbtcApiClientMainnet, SbtcApiClientTestnet } = await import('sbtc');

  const client = network === 'mainnet'
    ? new SbtcApiClientMainnet()
    : new SbtcApiClientTestnet();

  const deposit = await client.fetchDeposit(btcTxId);

  const statusMap: Record<string, BridgeStatusResult['status']> = {
    pending: 'pending',
    confirmed: 'confirmed',
    minted: 'minted',
    failed: 'failed',
  };

  return {
    status: statusMap[deposit.status] ?? 'pending',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    confirmations: (deposit as any).confirmations ?? 0,
    requiredConfirmations: 2,
    estimatedCompletion:
      deposit.status === 'pending'
        ? new Date(Date.now() + 20 * 60 * 1000)
        : undefined,
  };
}

// ─── Tx History ──────────────────────────────────────────────────────────────
// No sbtc import needed — uses Hiro API directly via fetch

export async function getTxHistory(
  stacksAddress: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<TxHistory[]> {
  const baseUrl = network === 'mainnet'
    ? 'https://api.mainnet.hiro.so'
    : 'https://api.testnet.hiro.so';

  const SBTC_CONTRACT = network === 'mainnet'
    ? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4'
    : 'ST1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28G8HXK9G';

  const res = await fetch(
    `${baseUrl}/extended/v1/address/${stacksAddress}/transactions?limit=20`
  );
  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.results ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((tx: any) => tx.contract_call?.contract_id?.startsWith(SBTC_CONTRACT))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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