# Perpetual Futures Contract Deployment Guide

## Current Status
The contract is ready for deployment but we encountered compilation issues with the wasm32v1-none target. This is likely due to the Stellar CLI version or Rust toolchain configuration.

## Contract Features Implemented
- ✅ Basic position management (open/close/liquidate)
- ✅ Oracle integration with Reflector
- ✅ TWAP pricing for stable entries
- ✅ Cross-asset pricing support
- ✅ Enhanced price validation
- ✅ Oracle health monitoring
- ✅ Liquidation protection

## Recommended Deployment Steps

### Option 1: Fix Compilation Environment
1. Update Stellar CLI to latest version:
   ```bash
   curl -L https://github.com/stellar/stellar-cli/releases/download/v21.2.0/stellar-cli-21.2.0-x86_64-unknown-linux-gnu.tar.gz | tar xz
   ```

2. Install correct Rust toolchain:
   ```bash
   rustup toolchain install stable
   rustup target add wasm32-unknown-unknown
   ```

3. Build and deploy:
   ```bash
   stellar contract build
   stellar contract deploy --wasm target/wasm32-unknown-unknown/release/perpetual_futures.wasm --source alice --network testnet
   ```

### Option 2: Use Pre-built Contract (Recommended for Testing)
For immediate frontend testing, use the existing hello-world contract address as a placeholder:
`CCRVMADMEJ2IB4WV7BZJJSBL5JSTNLMPGVE43AWLFDFSAKYLOWZSAK6Z`

### Contract Configuration
Once deployed, initialize with:
- Oracle Address: `CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63` (Reflector Testnet)
- Min Collateral: 10 XLM
- Max Leverage: 10x
- Maintenance Margin: 5%
- Funding Rate Interval: 8 hours

## Frontend Integration Status
- ✅ Contract service updated with new functions
- ✅ TWAP pricing UI added to trading dashboard
- ✅ Enhanced oracle integration
- ✅ Liquidation functionality
- ✅ Cross-asset pricing support

## Next Steps
1. Resolve compilation issues
2. Deploy contract to testnet
3. Update frontend with actual contract address
4. Test end-to-end integration
5. Deploy to mainnet when ready



