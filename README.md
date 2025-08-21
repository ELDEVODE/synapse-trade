# Synapse - Fullstack Stellar DApp

A modern, fullstack decentralized application built on Stellar blockchain with real-time data management powered by Convex.

## 🌟 Features

- **Stellar Smart Contracts**: Rust-based smart contracts deployed on Stellar
- **Wallet Integration**: Seamless integration with Freighter wallet
- **Real-time Database**: Convex backend for real-time data synchronization
- **Modern Frontend**: Next.js with TypeScript and Tailwind CSS
- **Transaction Tracking**: Comprehensive transaction history and analytics
- **Contract Management**: Deploy, interact with, and favorite smart contracts
- **User Dashboard**: Personalized analytics and activity overview

## 🏗️ Project Structure

```
synapse/
├── contracts/              # Stellar smart contracts (Rust)
│   └── hello_world/       # Example contract
│       ├── src/
│       │   ├── lib.rs     # Contract implementation
│       │   └── test.rs    # Contract tests
│       └── Cargo.toml     # Contract dependencies
├── frontend/              # Next.js frontend application
│   ├── convex/           # Convex backend functions
│   │   ├── schema.ts     # Database schema
│   │   ├── users.ts      # User management functions
│   │   ├── transactions.ts # Transaction management
│   │   └── contracts.ts  # Contract management
│   ├── src/
│   │   ├── app/          # Next.js app router
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility libraries
│   │   └── providers/    # Context providers
│   └── package.json
├── Cargo.toml            # Rust workspace configuration
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Bun](https://bun.sh/) (recommended) or npm
- [Rust](https://rustup.rs/) (for smart contracts)
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools) (optional)
- [Freighter Wallet](https://freighter.app/) browser extension

### Installation

1. **Install frontend dependencies**
   ```bash
   cd frontend
   bun install
   ```

2. **Start the development server**
   ```bash
   bun dev
   ```

3. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Smart Contract Development

1. **Build contracts**
   ```bash
   cargo build
   ```

2. **Run tests**
   ```bash
   cargo test
   ```

3. **Deploy to Stellar (testnet)**
   Follow the [Stellar smart contracts documentation](https://developers.stellar.org/docs/smart-contracts) for deployment instructions.

## 🔧 Configuration

### Environment Variables

The frontend uses the following environment variables (automatically set by Convex):

- `NEXT_PUBLIC_CONVEX_URL`: Your Convex deployment URL
- `CONVEX_DEPLOYMENT`: Your Convex deployment name

### Network Configuration

Edit `frontend/src/lib/stellar.ts` to configure the Stellar network:

```typescript
// For testnet (default)
export const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
export const networkPassphrase = StellarSdk.Networks.TESTNET;

// For mainnet (production)
export const server = new StellarSdk.Horizon.Server('https://horizon.stellar.org');
export const networkPassphrase = StellarSdk.Networks.PUBLIC;
```

## 📊 Database Schema

The application uses Convex with the following main tables:

- **users**: User accounts linked to Stellar public keys
- **transactions**: Complete transaction history with status tracking
- **contracts**: Smart contract deployments and metadata
- **contractInteractions**: Function calls and their results
- **userContracts**: User's favorite contracts and watchlists
- **notifications**: Real-time notifications for users
- **analytics**: Usage analytics and metrics

## 🎯 Key Components

### Frontend Components

- **WalletConnect**: Handles Freighter wallet connection
- **Dashboard**: User dashboard with analytics and transaction history
- **Transaction tracking**: Real-time transaction status updates
- **Contract favorites**: Manage and interact with favorite contracts

### Custom Hooks

- **useWallet**: Wallet connection and state management
- **useConvexUser**: User management with Convex
- **useConvexTransactions**: Transaction logging and retrieval
- **useConvexContracts**: Contract management and interactions
- **useStellarWithConvex**: Integrated Stellar + Convex operations

### Convex Functions

- **User Management**: Create/update user profiles
- **Transaction Logging**: Record and track all transactions
- **Contract Registry**: Manage deployed contracts
- **Analytics**: Track usage metrics and generate insights

## 🌐 Tech Stack

- **Blockchain**: Stellar
- **Smart Contracts**: Rust + Soroban
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Convex (real-time, serverless)
- **Wallet**: Freighter integration
- **Package Manager**: Bun

## 📱 Usage

### Connecting Your Wallet

1. Install the [Freighter wallet extension](https://freighter.app/)
2. Create or import a Stellar account
3. Connect to Stellar testnet
4. Click "Connect Wallet" in the application

### Interacting with Contracts

1. Deploy your smart contracts to Stellar testnet
2. Add contract addresses to `CONTRACT_ADDRESSES` in `stellar.ts`
3. Use the dashboard to interact with contracts
4. All interactions are automatically logged to Convex

### Viewing Analytics

The dashboard provides:
- Transaction history and status
- Contract interaction logs
- Success/failure rates
- Favorite contracts management
- Real-time notifications

## 🚧 Development

### Adding New Contracts

- New Soroban contracts can be put in `contracts`, each in their own directory
- Contracts should have their own `Cargo.toml` files that rely on the top-level `Cargo.toml` workspace for their dependencies
- The `hello_world` contract is included as a starting example

### Adding New Features

1. **Database Changes**: Update `convex/schema.ts`
2. **Backend Logic**: Add functions in `convex/` directory
3. **Frontend Hooks**: Create custom hooks in `src/hooks/`
4. **UI Components**: Add components in `src/components/`

### Testing

```bash
# Test smart contracts
cargo test

# Test frontend (when tests are added)
cd frontend
bun test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🔗 Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)
- [Convex Documentation](https://docs.convex.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Freighter Wallet](https://freighter.app/)

---

**Happy building on Stellar! 🚀**
