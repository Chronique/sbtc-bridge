import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'sbtc',
    'bs58check',
    '@scure/base',
    'bitcoin-address-validation',
  ],
  turbopack: {},
};

export default nextConfig;