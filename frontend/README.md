# Synapse Trade - AI-Powered Perpetual Futures Platform

A decentralized perpetual futures trading platform built on Stellar with AI-powered insights, real-time data, and professional trading tools.

## 🚀 Features

- **AI-Powered Trading**: Real-time risk assessment, trading signals, and portfolio analysis
- **Perpetual Futures**: Leveraged long/short positions on major cryptocurrencies
- **Reflector Oracle**: Secure, real-time price data from trusted sources
- **Freighter Integration**: Seamless wallet connection and transaction signing
- **Real-Time Updates**: Live data via Convex backend
- **Professional UI**: Modern, responsive trading interface

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Convex (Real-time database, serverless functions)
- **Blockchain**: Stellar Network, Soroban Smart Contracts
- **AI Services**: AIML API integration for trading insights
- **Wallet**: Freighter extension with official Stellar API

## 📋 Prerequisites

1. **Node.js 18+** or **Bun 1.0+**
2. **Freighter Extension** installed in your browser
3. **AIML API Key** from [api.aimlapi.com](https://api.aimlapi.com/)
4. **Convex Account** for backend services

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Using Bun (recommended)
bun install

# Using npm
npm install

# Using yarn
yarn install
```

### 2. Environment Setup

Copy the example environment file and configure your keys:

```bash
cp env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# AIML API Key (required for AI features)
AIML_API_KEY=your_actual_aiml_api_key_here

# Convex URL (get from your Convex dashboard)
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here

# Stellar Network (testnet for development)
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
```

### 3. Install Freighter Extension

1. Go to the [Chrome Web Store](https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdgncbk)
2. Install the Freighter extension
3. Create or import a Stellar account
4. Switch to Testnet network for development

### 4. Start Development Server

```bash
# Using Bun
bun run dev

# Using npm
npm run dev

# Using yarn
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### Freighter Wallet Setup

The platform uses the official `@stellar/freighter-api` package for reliable wallet integration:

```typescript
import { FreighterApi } from "@stellar/freighter-api";

// Initialize the API
const freighterApi = new FreighterApi();

// Check connection
const isConnected = await freighterApi.isConnected();

// Get public key
const publicKey = await freighterApi.getPublicKey();

// Sign transactions
const signedTx = await freighterApi.signTransaction(xdr, options);
```

### AI Services Configuration

AI services are configured in `src/config/ai.ts`:

```typescript
export const AI_CONFIG = {
  AIML_API: {
    BASE_URL: "https://api.aimlapi.com/v1",
    MODEL: "deepseek/deepseek-r1",
    TIMEOUT: 30000,
  },
  SERVICES: {
    RISK_ASSESSMENT: { ENABLED: true, AUTO_GENERATE: true },
    TRADING_SIGNALS: { ENABLED: true, AUTO_GENERATE: true },
    AI_CHAT: { ENABLED: true, MAX_HISTORY_LENGTH: 50 },
  },
};
```

## 🧪 Testing

### Freighter Integration Test

The platform includes a built-in test component to verify Freighter integration:

1. Connect your wallet
2. Use the "Freighter API Test" component
3. Test connection, public key retrieval, and account loading

### AI Services Test

Test AI functionality through the dashboard:

1. **Risk Assessment**: Analyze mock positions for risk
2. **Trading Signals**: Get AI-generated buy/sell signals
3. **AI Chat**: Ask trading questions and get professional advice
4. **Portfolio Analysis**: Get AI insights on your positions

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── AITradingDashboard.tsx    # Main AI dashboard
│   │   ├── FreighterTest.tsx         # Wallet integration test
│   │   └── WalletConnect.tsx         # Wallet connection UI
│   ├── hooks/               # Custom React hooks
│   │   ├── useAIServices.ts          # AI services integration
│   │   └── useWallet.ts              # Wallet state management
│   ├── lib/                 # Utility libraries
│   │   └── stellar.ts               # Stellar network integration
│   ├── config/              # Configuration files
│   │   └── ai.ts                    # AI service configuration
│   └── app/                 # Next.js app router
├── convex/                  # Convex backend functions
│   ├── ai.ts                        # AI service functions
│   ├── liquidationBot.ts            # Position monitoring
│   ├── marketData.ts                # Market data management
│   └── schema.ts                    # Database schema
└── package.json
```

## 🔌 API Integration

### AIML API

The platform integrates with AIML API for AI-powered trading insights:

- **Risk Assessment**: Position risk scoring and recommendations
- **Trading Signals**: Buy/sell/hold recommendations with confidence
- **Market Analysis**: Comprehensive market insights and trends
- **Portfolio Optimization**: AI-driven portfolio recommendations

### Stellar Network

- **Testnet**: Use for development and testing
- **Mainnet**: Switch when ready for production
- **Soroban**: Smart contract integration for trading logic
- **Reflector Oracle**: Real-time price data integration

## 🚀 Deployment

### Development

```bash
bun run dev
```

### Production Build

```bash
bun run build
bun start
```

### Environment Variables

Ensure all required environment variables are set in production:

- `AIML_API_KEY`: Your AIML API key
- `NEXT_PUBLIC_CONVEX_URL`: Your Convex deployment URL
- `NEXT_PUBLIC_STELLAR_NETWORK`: Network (testnet/mainnet)

## 🐛 Troubleshooting

### Freighter Connection Issues

1. **Extension not detected**: Ensure Freighter is installed and enabled
2. **Network mismatch**: Check that Freighter is on the same network as your app
3. **Permission denied**: Grant necessary permissions to the extension

### AI Services Issues

1. **API key invalid**: Verify your AIML API key in `.env.local`
2. **Rate limiting**: Check API usage limits and implement caching
3. **Response parsing**: Ensure AI responses match expected JSON format

### Convex Backend Issues

1. **Connection failed**: Verify your Convex URL
2. **Function errors**: Check Convex function logs
3. **Schema mismatches**: Ensure database schema matches your functions

## 📚 Additional Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Freighter Extension](https://www.freighter.app/)
- [Convex Documentation](https://docs.convex.dev/)
- [AIML API Documentation](https://api.aimlapi.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. Check the troubleshooting section above
2. Review the documentation
3. Open an issue on GitHub
4. Join our community discussions

---

**Happy Trading! 🚀📈**
