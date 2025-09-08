"use client";

import { TradingDashboard } from "@/components/TradingDashboard";
import { ConsumerLandingPage } from "@/components/ConsumerLandingPage";
import { useWallet } from "@/providers/WalletProvider";

function HomeContent() {
  const walletState = useWallet();

  if (walletState.isConnected) {
    return <TradingDashboard />;
  }

  return <ConsumerLandingPage />;
}

export default function Home() {
  return <HomeContent />;
}
