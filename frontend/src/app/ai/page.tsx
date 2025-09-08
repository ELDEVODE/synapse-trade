import { Suspense } from "react";
import { Metadata } from "next";
import AITradingPage from "@/components/AITradingPage";

// Enhanced metadata for the AI trading page
export const metadata: Metadata = {
  title: "AI Trading Assistant | Synapse Trade - Advanced Portfolio Analysis",
  description: "Experience the future of trading with our AI-powered assistant. Get real-time portfolio analysis, risk assessments, trading signals, and market insights for Stellar perpetual futures.",
  keywords: [
    "AI trading assistant",
    "portfolio analysis",
    "trading signals",
    "risk management",
    "market analysis",
    "Stellar blockchain",
    "perpetual futures",
    "DeFi trading",
    "artificial intelligence",
    "trading bot",
    "crypto analysis",
    "automated trading"
  ],
  authors: [{ name: "Synapse Trade Team" }],
  creator: "Synapse Trade",
  publisher: "Synapse Trade",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://synapse-trade.com"),
  alternates: {
    canonical: "/ai",
  },
  openGraph: {
    title: "AI Trading Assistant | Synapse Trade",
    description: "Advanced AI-powered trading insights and portfolio management for Stellar perpetual futures. Chat with AI, get trading signals, and optimize your portfolio.",
    url: "/ai",
    siteName: "Synapse Trade",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/api/og/ai-dashboard",
        width: 1200,
        height: 630,
        alt: "Synapse Trade AI Trading Dashboard - Portfolio Analysis and Trading Signals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@SynapseTrade",
    creator: "@SynapseTrade",
    title: "AI Trading Assistant | Synapse Trade",
    description: "Advanced AI-powered trading insights for Stellar perpetual futures. Portfolio analysis, risk assessment, and trading signals.",
    images: {
      url: "/api/og/ai-dashboard",
      alt: "Synapse Trade AI Dashboard",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
};

// Loading component for better UX
function AILoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse"></div>
            <div className="text-xl font-bold">Loading AI Assistant...</div>
          </div>
          <div className="flex space-x-1 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-4 max-w-md">
            Initializing AI models and loading your personalized trading insights...
          </p>
        </div>
      </div>
    </div>
  );
}

// Main AI page component
export default function AIPage() {
  return (
    <>
      {/* Preload critical resources */}
      <link
        rel="preload"
        href="/api/convex/ai/getTradingSignals"
        as="fetch"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/api/convex/marketData/getAllMarketData"
        as="fetch"
        crossOrigin="anonymous"
      />

      {/* JSON-LD structured data for enhanced SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Synapse Trade AI Assistant",
            description: "AI-powered trading assistant for Stellar perpetual futures with portfolio analysis, risk assessment, and trading signals",
            url: "https://synapse-trade.com/ai",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web Browser",
            browserRequirements: "Requires JavaScript. Works with Chrome, Firefox, Safari, Edge.",
            permissions: "Wallet connection required for personalized insights",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              description: "Free AI trading assistant with premium features",
            },
            featureList: [
              "Real-time portfolio analysis",
              "AI-powered risk assessment",
              "Trading signal generation",
              "Market sentiment analysis",
              "Interactive AI chat assistant",
              "Performance analytics and tracking",
              "Automated risk management suggestions",
              "Multi-asset portfolio optimization"
            ],
            screenshot: "https://synapse-trade.com/images/ai-dashboard-screenshot.png",
            softwareVersion: "2.0",
            datePublished: "2024-01-01",
            dateModified: new Date().toISOString(),
            provider: {
              "@type": "Organization",
              name: "Synapse Trade",
              url: "https://synapse-trade.com",
              logo: "https://synapse-trade.com/logo.png",
              sameAs: [
                "https://twitter.com/SynapseTrade",
                "https://github.com/synapse-trade",
              ],
            },
            audience: {
              "@type": "Audience",
              audienceType: "Cryptocurrency Traders, DeFi Users, Portfolio Managers",
            },
            inLanguage: "en-US",
            isAccessibleForFree: true,
            usageInfo: "https://synapse-trade.com/terms",
            privacyPolicy: "https://synapse-trade.com/privacy",
          }),
        }}
      />

      {/* Breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://synapse-trade.com",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "AI Trading Assistant",
                item: "https://synapse-trade.com/ai",
              },
            ],
          }),
        }}
      />

      {/* FAQ structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What is the Synapse Trade AI Assistant?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The Synapse Trade AI Assistant is an advanced artificial intelligence system that provides real-time portfolio analysis, risk assessment, trading signals, and market insights for Stellar perpetual futures trading.",
                },
              },
              {
                "@type": "Question",
                name: "How does the AI analyze my portfolio?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Our AI analyzes your positions, trading history, risk metrics, diversification, leverage usage, and market conditions to provide personalized insights and recommendations for optimizing your trading performance.",
                },
              },
              {
                "@type": "Question",
                name: "Are the AI trading signals reliable?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Our AI trading signals are generated using advanced machine learning models trained on market data, but they should be used as guidance alongside your own research. Past performance doesn't guarantee future results.",
                },
              },
              {
                "@type": "Question",
                name: "Is the AI assistant free to use?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, the basic AI assistant features are free to use. You only need to connect your Stellar wallet to access personalized portfolio analysis and trading insights.",
                },
              },
            ],
          }),
        }}
      />

      {/* Main content with Suspense boundary */}
      <Suspense fallback={<AILoadingFallback />}>
        <AITradingPage />
      </Suspense>
    </>
  );
}
