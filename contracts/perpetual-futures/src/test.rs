#![cfg(test)]

use super::{PerpetualFutures, PerpetualFuturesClient};
use soroban_sdk::testutils::Address as TestAddress;
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol};

use super::reflector::{Asset, PriceData};

#[contract]
pub struct ReflectorMock;

#[contractimpl]
impl ReflectorMock {
    pub fn lastprice(env: Env, asset: Asset) -> Option<PriceData> {
        // Return a mock price for BTC
        let price = match asset {
            Asset::Other(symbol) if symbol == Symbol::new(&env, "BTC") => {
                50_000_000_000_000i128 // $50,000 with 14 decimals
            }
            _ => 1_000_000_000_000i128, // Default $1,000 with 14 decimals
        };

        Some(PriceData {
            price,
            timestamp: env.ledger().timestamp(),
        })
    }

    pub fn decimals() -> u32 {
        14
    }
}

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PerpetualFutures);
    let client = PerpetualFuturesClient::new(&env, &contract_id);

    let admin = <soroban_sdk::Address as TestAddress>::generate(&env);
    let treasury = <soroban_sdk::Address as TestAddress>::generate(&env);
    let min_collateral = 100_000_000i128; // 100 USDC (6 decimals)
    let max_leverage = 10;
    let maintenance_margin = 500i128; // 5%
    let funding_rate_interval = 3600u64; // 1 hour

    client.initialize(
        &admin,
        &treasury,
        &min_collateral,
        &max_leverage,
        &maintenance_margin,
        &funding_rate_interval,
    );

    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_min_collateral(), min_collateral);
    assert_eq!(client.get_max_leverage(), max_leverage);
    assert_eq!(client.get_maintenance_margin(), maintenance_margin);
}

#[test]
fn test_initialize_already_initialized() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PerpetualFutures);
    let client = PerpetualFuturesClient::new(&env, &contract_id);

    let admin = <soroban_sdk::Address as TestAddress>::generate(&env);
    let treasury = <soroban_sdk::Address as TestAddress>::generate(&env);
    let min_collateral = 100_000_000i128;
    let max_leverage = 10;
    let maintenance_margin = 500i128;
    let funding_rate_interval = 3600u64;

    client.initialize(
        &admin,
        &treasury,
        &min_collateral,
        &max_leverage,
        &maintenance_margin,
        &funding_rate_interval,
    );

    // Try to initialize again
    let result = client.try_initialize(
        &admin,
        &treasury,
        &min_collateral,
        &max_leverage,
        &maintenance_margin,
        &funding_rate_interval,
    );

    assert!(result.is_err());
}

#[test]
fn test_open_position() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PerpetualFutures);
    let client = PerpetualFuturesClient::new(&env, &contract_id);

    let reflector_id = env.register_contract(None, ReflectorMock);
    let reflector_client = ReflectorMockClient::new(&env, &reflector_id);

    let admin = <soroban_sdk::Address as TestAddress>::generate(&env);
    let treasury = <soroban_sdk::Address as TestAddress>::generate(&env);
    let min_collateral = 100_000_000i128; // 100 USDC (6 decimals)
    let max_leverage = 10;
    let maintenance_margin = 500i128; // 5%
    let funding_rate_interval = 3600u64; // 1 hour

    // Initialize the contract
    client.initialize(
        &admin,
        &treasury,
        &min_collateral,
        &max_leverage,
        &maintenance_margin,
        &funding_rate_interval,
    );

    // Set the oracle address
    client.set_oracle(&reflector_id);

    // Set a price for BTC
    let btc_asset = Asset::Other(Symbol::new(&env, "BTC"));
    reflector_client.lastprice(&btc_asset);

    // Test opening a position with BTC
    let btc_symbol = Symbol::new(&env, "BTC");
    let size = 1_000_000i128; // 1 BTC (6 decimals)
    let leverage = 2;
    let collateral = 200_000_000i128; // 200 USDC

    let result = client.try_open_position(&btc_symbol, &size, &leverage, &collateral);
    assert!(result.is_ok());
}

#[test]
fn test_close_position() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PerpetualFutures);
    let client = PerpetualFuturesClient::new(&env, &contract_id);

    let reflector_id = env.register_contract(None, ReflectorMock);
    let reflector_client = ReflectorMockClient::new(&env, &reflector_id);

    let admin = <soroban_sdk::Address as TestAddress>::generate(&env);
    let treasury = <soroban_sdk::Address as TestAddress>::generate(&env);
    let min_collateral = 100_000_000i128; // 100 USDC (6 decimals)
    let max_leverage = 10;
    let maintenance_margin = 500i128; // 5%
    let funding_rate_interval = 3600u64; // 1 hour

    // Initialize the contract
    client.initialize(
        &admin,
        &treasury,
        &min_collateral,
        &max_leverage,
        &maintenance_margin,
        &funding_rate_interval,
    );

    // Set the oracle address
    client.set_oracle(&reflector_id);

    // Set a price for BTC
    let btc_asset = Asset::Other(Symbol::new(&env, "BTC"));
    reflector_client.lastprice(&btc_asset);

    // Test opening a position with BTC
    let btc_symbol = Symbol::new(&env, "BTC");
    let size = 1_000_000i128; // 1 BTC (6 decimals)
    let leverage = 2;
    let collateral = 200_000_000i128; // 200 USDC

    let position_id = client.open_position(&btc_symbol, &size, &leverage, &collateral);

    let result = client.try_close_position(&position_id);
    assert!(result.is_ok());
}
