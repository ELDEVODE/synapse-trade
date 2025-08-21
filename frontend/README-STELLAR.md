# Synapse - Stellar Frontend

This is the frontend component of your fullstack Stellar application. It's built with Next.js and includes wallet integration with Freighter.

## Features

- 🌟 **Stellar Integration**: Ready-to-use Stellar SDK integration
- 💳 **Wallet Connection**: Freighter wallet support
- 🎨 **Modern UI**: Built with Tailwind CSS
- 🔧 **TypeScript**: Full TypeScript support
- ⚡ **Fast Development**: Hot reloading with Next.js

## Getting Started

### Prerequisites

1. Install [Freighter Wallet](https://freighter.app) browser extension
2. Set up a Stellar testnet account (you can get testnet XLM from the [friendbot](https://laboratory.stellar.org/#account-creator?network=test))

### Installation

```bash
# Install dependencies
bun install

# Start the development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   │   └── WalletConnect.tsx
│   ├── hooks/               # Custom React hooks
│   │   └── useWallet.ts
│   ├── lib/                 # Utility libraries
│   │   └── stellar.ts       # Stellar SDK integration
│   └── types/               # TypeScript type definitions
│       └── freighter.d.ts
├── public/                  # Static assets
└── package.json
```

## Configuration

### Network Configuration

Edit `src/lib/stellar.ts` to configure the Stellar network:

```typescript
// For testnet (default)
export const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
export const networkPassphrase = StellarSdk.Networks.TESTNET;

// For mainnet (production)
export const server = new StellarSdk.Horizon.Server('https://horizon.stellar.org');
export const networkPassphrase = StellarSdk.Networks.PUBLIC;
```

### Contract Addresses

Add your deployed contract addresses in `src/lib/stellar.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  YOUR_CONTRACT_NAME: 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  // Add more contracts as needed
};
```

## Usage

### Connecting a Wallet

The `WalletConnect` component handles Freighter wallet connections:

```tsx
import WalletConnect from '@/components/WalletConnect';

export default function MyPage() {
  return <WalletConnect />;
}
```

### Using the Wallet Hook

The `useWallet` hook provides wallet state and methods:

```tsx
import { useWallet } from '@/hooks/useWallet';

export default function MyComponent() {
  const { isConnected, publicKey, connect } = useWallet();
  
  if (!isConnected) {
    return <button onClick={connect}>Connect Wallet</button>;
  }
  
  return <p>Connected: {publicKey}</p>;
}
```

### Contract Interactions

Use the `stellarService` to interact with contracts:

```tsx
import { stellarService } from '@/lib/stellar';

// Example contract call
const result = await stellarService.callContract(
  'CONTRACT_ADDRESS',
  'function_name',
  [/* function arguments */]
);
```

## Development Tips

1. **Test on Testnet**: Always test your contracts on testnet before mainnet deployment
2. **Error Handling**: The wallet components include comprehensive error handling
3. **Type Safety**: All Stellar interactions are fully typed with TypeScript
4. **Hot Reloading**: Changes to React components will hot reload automatically

## Deployment

### Build for Production

```bash
bun run build
```

### Environment Variables

Create a `.env.local` file for environment-specific configuration:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
```

## Related

- [Stellar Documentation](https://developers.stellar.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Freighter Wallet](https://freighter.app/)
- [Tailwind CSS](https://tailwindcss.com/)

## Contract Integration

Your smart contracts are located in the `../contracts/` directory. After deploying your contracts:

1. Update contract addresses in `src/lib/stellar.ts`
2. Add contract-specific functions to interact with your deployed contracts
3. Create UI components to interact with your contract functions

Happy building! 🚀
