import React from "react";
import { Metadata } from "next";
import ModernAIDashboard from "./ModernAIDashboard";

// Server-side metadata for SEO
export const metadata: Metadata = {
  title: "AI Trading Assistant - Synapse Trade",
  description: "Advanced AI-powered trading insights, portfolio analysis, and market recommendations for perpetual futures trading on Stellar.",
  keywords: [
    "AI trading",
    "portfolio analysis", 
    "trading signals",
    "risk assessment",
    "market analysis",
    "Stellar blockchain",
    "perpetual futures",
    "DeFi trading"
  ],
  openGraph: {
    title: "AI Trading Assistant - Synapse Trade",
    description: "Get AI-powered trading insights and recommendations for your Stellar perpetual futures portfolio.",
    type: "website",
    images: [
      {
        url: "/api/og/ai-dashboard",
        width: 1200,
        height: 630,
        alt: "Synapse Trade AI Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Trading Assistant - Synapse Trade",
    description: "Advanced AI-powered trading insights for Stellar perpetual futures.",
    images: ["/api/og/ai-dashboard"],
  },
};

// Server Component wrapper for the AI Dashboard
const AITradingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* SEO-friendly content that loads immediately */}
      <div className="sr-only">
        <h1>AI Trading Assistant</h1>
        <p>
          Advanced artificial intelligence-powered trading assistant for Stellar blockchain perpetual futures.
          Get real-time portfolio analysis, risk assessments, trading signals, and market insights.
        </p>
        <h2>Features</h2>
        <ul>
          <li>Real-time portfolio analysis and risk assessment</li>
          <li>AI-generated trading signals and recommendations</li>
          <li>Interactive chat with AI trading assistant</li>
          <li>Market sentiment analysis and insights</li>
          <li>Performance tracking and analytics</li>
          <li>Automated risk management suggestions</li>
        </ul>
      </div>

      {/* Loading skeleton for better UX */}
      <div id="ai-dashboard-skeleton" className="animate-pulse">
        {/* Header skeleton */}
        <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                <div className="h-6 w-48 bg-gray-700 rounded"></div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-4 w-24 bg-gray-700 rounded"></div>
                <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                <div className="h-4 w-16 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation skeleton */}
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 w-24 bg-gray-700 rounded"></div>
              ))}
            </nav>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-700 rounded"></div>
                    <div className="h-8 w-24 bg-gray-700 rounded"></div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gray-700"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="h-6 w-32 bg-gray-700 rounded mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-3 p-4 bg-gray-700/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-gray-600 mt-2"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-gray-600 rounded"></div>
                    <div className="h-3 w-full bg-gray-600 rounded"></div>
                  </div>
                  <div className="h-3 w-16 bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Client-side AI Dashboard */}
      <ModernAIDashboard />

      {/* Hide skeleton once client component loads */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              setTimeout(function() {
                const skeleton = document.getElementById('ai-dashboard-skeleton');
                if (skeleton) {
                  skeleton.style.display = 'none';
                }
              }, 100);
            });
          `,
        }}
      />

      {/* Structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Synapse Trade AI Assistant",
            description: "AI-powered trading assistant for Stellar perpetual futures",
            url: "https://synapse-trade.com/ai",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            featureList: [
              "Portfolio Analysis",
              "Risk Assessment", 
              "Trading Signals",
              "Market Insights",
              "AI Chat Assistant",
              "Performance Analytics"
            ],
            provider: {
              "@type": "Organization",
              name: "Synapse Trade",
              url: "https://synapse-trade.com",
            },
          }),
        }}
      />
    </div>
  );
};

export default AITradingPage;
