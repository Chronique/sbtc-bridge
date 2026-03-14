import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'sbtc',
    'bs58check',
    '@scure/base',
    'bitcoin-address-validation',
    '@stacks/connect',
    '@stacks/transactions',
  ],
};

export default nextConfig;