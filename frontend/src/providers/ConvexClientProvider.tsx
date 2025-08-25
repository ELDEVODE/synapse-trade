"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Create Convex client with fallback for development
const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  // Show warning if using placeholder URL
  if (convexUrl === "https://placeholder.convex.cloud") {
    console.warn(
      "⚠️ NEXT_PUBLIC_CONVEX_URL not set. Using placeholder URL. Set up Convex or add to .env.local"
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
