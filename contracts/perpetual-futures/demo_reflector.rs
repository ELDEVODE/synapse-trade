use soroban_sdk::{Address, Env, Symbol};
use perpetual_futures::reflector::{ReflectorClient, Asset, PriceData};

// This demonstrates how to interact with the real Reflector oracle
fn main() {
    println!("🔮 Reflector Oracle Integration Demo");
    println!("=====================================");
    
    // Create a test environment
    let env = Env::default();
    
    // Real Reflector oracle addresses
    let testnet_oracle = "CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63";
    let mainnet_oracle = "CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN";
    
    println!("📋 Oracle Addresses:");
    println!("   Testnet: {}", testnet_oracle);
    println!("   Mainnet: {}", mainnet_oracle);
    
    // For demo purposes, we'll use a mock oracle since we can't connect to real testnet
    // In production, you would use the real addresses above
    
    // Create mock oracle for demonstration
    let mock_oracle_id = env.register_contract(None, perpetual_futures::test::ReflectorMock);
    let oracle_address = Address::from_str(&env, &mock_oracle_id.to_string());
    
    println!("\n🔗 Connecting to Oracle: {}", oracle_address);
    
    // Create Reflector client
    let reflector_client = ReflectorClient::new(&env, &oracle_address);
    
    // Test fetching different asset prices
    let assets = vec!["BTC", "ETH", "SOL"];
    
    println!("\n💰 Fetching Asset Prices:");
    println!("   (Note: Using mock prices for demo)");
    
    for asset_name in assets {
        let asset = Asset::Other(Symbol::new(&env, asset_name));
        
        match reflector_client.lastprice(&asset) {
            Some(price_data) => {
                let price_usd = price_data.price as f64 / 10_000_000_000_000.0;
                println!("   {}: ${:.2} (timestamp: {})", 
                    asset_name, price_usd, price_data.timestamp);
            }
            None => {
                println!("   {}: Price not available", asset_name);
            }
        }
    }
    
    // Test TWAP (Time-Weighted Average Price)
    println!("\n📊 TWAP Calculations:");
    for asset_name in assets {
        let asset = Asset::Other(Symbol::new(&env, asset_name));
        
        match reflector_client.twap(&asset, &5) { // 5 recent records
            Some(twap_price) => {
                let price_usd = twap_price as f64 / 10_000_000_000_000.0;
                println!("   {} TWAP (5 records): ${:.2}", asset_name, price_usd);
            }
            None => {
                println!("   {} TWAP: Not available", asset_name);
            }
        }
    }
    
    // Test cross-price calculations
    println!("\n🔄 Cross-Price Calculations:");
    let btc_asset = Asset::Other(Symbol::new(&env, "BTC"));
    let eth_asset = Asset::Other(Symbol::new(&env, "ETH"));
    
    match reflector_client.x_last_price(&btc_asset, &eth_asset) {
        Some(cross_price) => {
            let price_ratio = cross_price.price as f64 / 10_000_000_000_000.0;
            println!("   BTC/ETH ratio: {:.6}", price_ratio);
        }
        None => {
            println!("   BTC/ETH cross-price: Not available");
        }
    }
    
    // Get oracle metadata
    println!("\n📈 Oracle Metadata:");
    println!("   Decimals: {}", reflector_client.decimals());
    println!("   Resolution: {} seconds", reflector_client.resolution());
    println!("   Last Timestamp: {}", reflector_client.last_timestamp());
    println!("   Version: {}", reflector_client.version());
    
    // Demonstrate how this integrates with the PerpetualFutures contract
    println!("\n🚀 Integration with PerpetualFutures:");
    println!("   The contract can now:");
    println!("   ✅ Fetch real-time prices from Reflector");
    println!("   ✅ Calculate position values and PnL");
    println!("   ✅ Determine liquidation prices");
    println!("   ✅ Implement dynamic funding rates");
    
    println!("\n🎉 Oracle integration demo completed!");
    println!("Ready to deploy and trade with real oracle data!");
}
