use soroban_sdk::testutils::Address as TestAddress;
use soroban_sdk::{Address, Env, Symbol};

// This demonstrates how to interact with the PerpetualFutures contract
fn main() {
    println!("🚀 Synapse Trade - Perpetual Futures Contract Demo");
    println!("==================================================");

    // Create a test environment
    let env = Env::default();

    // Deploy the PerpetualFutures contract
    let contract_id = env.register_contract(None, perpetual_futures::PerpetualFutures);
    let client = perpetual_futures::PerpetualFuturesClient::new(&env, &contract_id);

    // Deploy a mock Reflector oracle
    let oracle_id = env.register_contract(None, perpetual_futures::test::ReflectorMock);

    // Generate test addresses
    let admin = <soroban_sdk::Address as TestAddress>::generate(&env);
    let treasury = <soroban_sdk::Address as TestAddress>::generate(&env);

    println!("📋 Contract Configuration:");
    println!("   Contract ID: {}", contract_id);
    println!("   Oracle ID: {}", oracle_id);
    println!("   Admin: {}", admin);
    println!("   Treasury: {}", treasury);

    // Initialize the contract
    println!("\n🔧 Initializing contract...");
    client.initialize(
        &admin,
        &treasury,
        &100_000_000i128, // 100 USDC min collateral
        &10,              // Max leverage 10x
        &500i128,         // 5% maintenance margin
        &3600u64,         // 1 hour funding interval
    );

    // Set the oracle address
    client.set_oracle(&oracle_id);

    println!("✅ Contract initialized successfully!");

    // Fetch contract information
    println!("\n📊 Contract Information:");
    println!("   Admin: {}", client.get_admin());
    println!(
        "   Min Collateral: {} USDC",
        client.get_min_collateral() / 1_000_000
    );
    println!("   Max Leverage: {}x", client.get_max_leverage());
    println!(
        "   Maintenance Margin: {}%",
        client.get_maintenance_margin() / 100
    );
    println!("   Total Positions: {}", client.get_total_positions());

    // Test opening a position
    println!("\n📈 Opening BTC Position:");
    let btc_symbol = Symbol::new(&env, "BTC");
    let size = 1_000_000i128; // 1 BTC (6 decimals)
    let leverage = 2; // 2x leverage
    let collateral = 200_000_000i128; // 200 USDC

    println!("   Asset: BTC");
    println!("   Size: {} BTC", size / 1_000_000);
    println!("   Leverage: {}x", leverage);
    println!("   Collateral: {} USDC", collateral / 1_000_000);

    let position_id = client.open_position(&btc_symbol, &size, &leverage, &collateral);
    println!("   ✅ Position opened with ID: {}", position_id);

    // Fetch position information
    println!("\n📋 Position Details:");
    let position = client.get_position(&position_id);
    println!("   Position ID: {}", position.id);
    println!("   User: {}", position.user);
    println!("   Asset: {:?}", position.asset);
    println!("   Size: {} BTC", position.size / 1_000_000);
    println!("   Leverage: {}x", position.leverage);
    println!("   Collateral: {} USDC", position.collateral / 1_000_000);
    println!(
        "   Entry Price: ${}",
        position.entry_price / 10_000_000_000_000i128
    );
    println!("   Is Open: {}", position.is_open);

    // Check if position is liquidatable
    println!("\n⚠️  Liquidation Check:");
    let is_liquidatable = client.is_position_liquidatable(&position_id);
    match is_liquidatable {
        Ok(liquidatable) => println!("   Position liquidatable: {}", liquidatable),
        Err(e) => println!("   Error checking liquidation: {:?}", e),
    }

    // Get total positions count
    println!("\n📊 Updated Contract State:");
    println!("   Total Open Positions: {}", client.get_total_positions());

    // Get user positions
    let user_positions = client.get_user_positions(&admin);
    println!("   User Positions: {:?}", user_positions);

    println!("\n🎉 Demo completed successfully!");
    println!("The contract is working and can fetch real information!");
}
