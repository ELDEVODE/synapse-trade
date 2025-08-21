#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, vec, Address, Env, Symbol,
    Vec,
};

// Import Reflector oracle interface
mod reflector;
use reflector::{Asset as ReflectorAsset, ReflectorClient};

#[contract]
pub struct PerpetualFutures;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InsufficientCollateral = 4,
    PositionNotFound = 5,
    InvalidLeverage = 6,
    InvalidAsset = 7,
    PriceStale = 8,
    InsufficientLiquidity = 9,
    PositionTooSmall = 10,
    MaintenanceMarginNotMet = 11,
    OracleError = 12,
    InvalidAmount = 13,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Position {
    pub id: u64,
    pub user: Address,
    pub asset: ReflectorAsset,
    pub size: i128, // Positive for long, negative for short
    pub collateral: i128,
    pub entry_price: i128,
    pub leverage: u32,
    pub timestamp: u64,
    pub is_open: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MarketConfig {
    pub asset: ReflectorAsset,
    pub min_collateral: i128,
    pub max_leverage: u32,
    pub maintenance_margin: i128,   // In basis points (e.g., 500 = 5%)
    pub funding_rate_interval: u64, // In seconds
    pub oracle_address: Address,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FundingRate {
    pub asset: ReflectorAsset,
    pub rate: i128, // In basis points (e.g., 100 = 1%)
    pub timestamp: u64,
}

#[contractimpl]
impl PerpetualFutures {
    // Initialize the contract
    pub fn initialize(
        env: Env,
        admin: Address,
        treasury: Address,
        min_collateral: i128,
        max_leverage: u32,
        maintenance_margin: i128,
        funding_rate_interval: u64,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&symbol_short!("init")) {
            return Err(Error::AlreadyInitialized);
        }

        env.storage()
            .instance()
            .set(&symbol_short!("admin"), &admin);
        env.storage()
            .instance()
            .set(&symbol_short!("treasury"), &treasury);
        env.storage()
            .instance()
            .set(&symbol_short!("min_coll"), &min_collateral);
        env.storage()
            .instance()
            .set(&symbol_short!("max_lev"), &max_leverage);
        env.storage()
            .instance()
            .set(&symbol_short!("marg"), &maintenance_margin);
        env.storage()
            .instance()
            .set(&symbol_short!("fund_int"), &funding_rate_interval);

        // Set the Reflector oracle address for external CEX & DEX price feeds
        // Testnet: CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63
        // Mainnet: CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN
        let oracle_address = Address::from_str(
            &env,
            "CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63",
        );
        env.storage()
            .instance()
            .set(&symbol_short!("oracle"), &oracle_address);

        env.storage().instance().set(&symbol_short!("init"), &true);

        Ok(())
    }

    // Open a new position
    pub fn open_position(
        env: Env,
        asset_symbol: Symbol, // Asset symbol like "BTC", "ETH", "SOL"
        size: i128,
        leverage: u32,
        collateral: i128,
    ) -> Result<u64, Error> {
        // Validate inputs
        if collateral < Self::get_min_collateral(env.clone()) {
            return Err(Error::InsufficientCollateral);
        }
        if leverage > Self::get_max_leverage(env.clone()) || leverage == 0 {
            return Err(Error::InvalidLeverage);
        }
        if size == 0 {
            return Err(Error::PositionTooSmall);
        }

        // Create ReflectorAsset::Other for external assets
        let asset = ReflectorAsset::Other(asset_symbol);

        // Get current price from oracle
        let oracle_address = Self::get_oracle_address(&env)?;
        let reflector_client = ReflectorClient::new(&env, &oracle_address);

        let price_data = reflector_client
            .lastprice(&asset)
            .ok_or(Error::OracleError)?;

        // Check if price is stale (older than 6 minutes to allow for oracle resolution)
        let current_timestamp = env.ledger().timestamp();
        if current_timestamp - price_data.timestamp >= 360 {
            return Err(Error::PriceStale);
        }

        let entry_price = price_data.price;

        // Calculate position value and required margin
        let position_value = size.abs() * entry_price / 10_000_000_000_000_000i128; // 14 decimals = 10^14
        let required_margin = position_value / leverage as i128;

        if collateral < required_margin {
            return Err(Error::InsufficientCollateral);
        }

        // Generate position ID
        let position_id = Self::get_next_position_id(&env);

        let position = Position {
            id: position_id,
            user: env.current_contract_address(),
            asset,
            size,
            leverage,
            collateral,
            entry_price,
            timestamp: current_timestamp,
            is_open: true,
        };

        // Store position
        env.storage()
            .instance()
            .set(&(symbol_short!("pos"), position_id), &position);

        // Update user positions
        let mut user_positions =
            Self::get_user_positions(env.clone(), env.current_contract_address());
        user_positions.push_back(position_id);
        env.storage().instance().set(
            &(symbol_short!("user_pos"), env.current_contract_address()),
            &user_positions,
        );

        // Update total open positions
        let total_positions = Self::get_total_positions(env.clone()) + 1;
        env.storage()
            .instance()
            .set(&symbol_short!("total_pos"), &total_positions);

        Ok(position_id)
    }

    // Close a position
    pub fn close_position(env: Env, position_id: u64) -> Result<(), Error> {
        let position: Position = env
            .storage()
            .instance()
            .get(&(symbol_short!("pos"), position_id))
            .ok_or(Error::PositionNotFound)?;

        if !position.is_open {
            return Err(Error::PositionNotFound);
        }

        // Get current price from oracle
        let oracle_address = Self::get_oracle_address(&env)?;
        let reflector_client = ReflectorClient::new(&env, &oracle_address);

        let price_data = reflector_client
            .lastprice(&position.asset)
            .ok_or(Error::OracleError)?;

        let current_price = price_data.price;

        // Calculate PnL
        let pnl = if position.size > 0 {
            // Long position
            (current_price - position.entry_price) * position.size / 10_000_000_000_000_000i128
        } else {
            // Short position
            (position.entry_price - current_price) * position.size.abs()
                / 10_000_000_000_000_000i128
        };

        // Calculate final collateral
        let _final_collateral = position.collateral + pnl;

        // Update position
        let mut updated_position = position;
        updated_position.is_open = false;
        env.storage()
            .instance()
            .set(&(symbol_short!("pos"), position_id), &updated_position);

        // Update total open positions
        let total_positions = Self::get_total_positions(env.clone()) - 1;
        env.storage()
            .instance()
            .set(&symbol_short!("total_pos"), &total_positions);

        // Transfer final collateral back to user (this would need to be implemented with actual token transfers)

        Ok(())
    }

    // Liquidate an undercollateralized position
    pub fn liquidate_position(env: Env, position_id: u64) -> Result<(), Error> {
        let position: Position = env
            .storage()
            .instance()
            .get(&(symbol_short!("pos"), position_id))
            .ok_or(Error::PositionNotFound)?;

        if !position.is_open {
            return Err(Error::PositionNotFound);
        }

        // Check if position needs liquidation
        if !Self::is_position_liquidatable(&env, &position)? {
            return Err(Error::MaintenanceMarginNotMet);
        }

        // Close position at current price (similar to close_position but without PnL calculation)
        let mut updated_position = position;
        updated_position.is_open = false;
        env.storage()
            .instance()
            .set(&(symbol_short!("pos"), position_id), &updated_position);

        // Update total open positions
        let total_positions = Self::get_total_positions(env.clone()) - 1;
        env.storage()
            .instance()
            .set(&symbol_short!("total_pos"), &total_positions);

        // Transfer remaining collateral to treasury (this would need to be implemented with actual token transfers)

        Ok(())
    }

    // Get position details
    pub fn get_position(env: Env, position_id: u64) -> Result<Position, Error> {
        env.storage()
            .instance()
            .get(&(symbol_short!("pos"), position_id))
            .ok_or(Error::PositionNotFound)
    }

    // Get user positions
    pub fn get_user_positions(env: Env, user: Address) -> Vec<u64> {
        env.storage()
            .instance()
            .get(&(symbol_short!("user_pos"), user))
            .unwrap_or_else(|| vec![&env])
    }

    // Get total open positions count
    pub fn get_total_positions(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&symbol_short!("total_pos"))
            .unwrap_or(0)
    }

    // Get contract admin
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&symbol_short!("admin"))
            .unwrap()
    }

    // Get minimum collateral requirement
    pub fn get_min_collateral(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&symbol_short!("min_coll"))
            .unwrap()
    }

    // Get maximum leverage
    pub fn get_max_leverage(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&symbol_short!("max_lev"))
            .unwrap()
    }

    // Get maintenance margin
    pub fn get_maintenance_margin(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&symbol_short!("marg"))
            .unwrap()
    }

    pub fn set_oracle(env: Env, oracle_address: Address) {
        env.storage()
            .instance()
            .set(&symbol_short!("oracle"), &oracle_address);
    }

    // Helper function to get next position ID
    fn get_next_position_id(env: &Env) -> u64 {
        let current_id = env
            .storage()
            .instance()
            .get(&symbol_short!("next_id"))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&symbol_short!("next_id"), &(current_id + 1));
        current_id + 1
    }

    // Helper function to get oracle address
    fn get_oracle_address(env: &Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&symbol_short!("oracle"))
            .ok_or(Error::OracleError)
    }

    // Helper function to check if position is liquidatable
    fn is_position_liquidatable(env: &Env, position: &Position) -> Result<bool, Error> {
        let oracle_address = Self::get_oracle_address(env)?;
        let reflector_client = ReflectorClient::new(&env.clone(), &oracle_address);

        let price_data = reflector_client
            .lastprice(&position.asset)
            .ok_or(Error::OracleError)?;

        let current_price = price_data.price;

        // Calculate current position value
        let position_value = position.size.abs() * current_price / 10_000_000_000_000_000i128;
        let required_margin = position_value / position.leverage as i128;

        // Check if current collateral meets maintenance margin
        let maintenance_margin_required =
            required_margin * Self::get_maintenance_margin(env.clone().clone()) / 10_000i128;

        Ok(position.collateral < maintenance_margin_required)
    }
}

mod test;
