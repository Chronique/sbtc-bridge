import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/lib/wallet-context';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'sBTC Bridge — BTC ↔ sBTC on Stacks',
  description: 'Native Bitcoin bridging on Stacks. Deposit BTC, receive sBTC. Withdraw anytime.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white antialiased min-h-screen" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <WalletProvider>
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 py-8">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
