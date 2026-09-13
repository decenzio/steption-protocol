#![no_std]
// TESTNET FIXTURE ONLY. Its administrator controls prices. It is not a market oracle.
use oracle_interface::{Asset, PriceData};
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Vec};
#[contracttype]
#[derive(Clone)]
enum Key {
    Admin,
    Price(Asset, u64),
}
#[contract]
pub struct MockOracle;
#[contractimpl]
impl MockOracle {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&Key::Admin, &admin);
    }
    pub fn base(_env: Env) -> Asset {
        Asset::Other(symbol_short!("USD"))
    }
    pub fn assets(env: Env) -> Vec<Asset> {
        soroban_sdk::vec![
            &env,
            Asset::Other(symbol_short!("XLM")),
            Asset::Other(symbol_short!("USDC"))
        ]
    }
    pub fn decimals(_env: Env) -> u32 {
        7
    }
    pub fn resolution(_env: Env) -> u32 {
        300
    }
    pub fn price(env: Env, asset: Asset, timestamp: u64) -> Option<PriceData> {
        env.storage()
            .persistent()
            .get(&Key::Price(asset, timestamp))
    }
    pub fn set_price(env: Env, asset: Asset, timestamp: u64, value: i128) {
        let admin: Address = env.storage().instance().get(&Key::Admin).unwrap();
        admin.require_auth();
        assert!(
            timestamp % 300 == 0 && value > 0 && timestamp <= env.ledger().timestamp(),
            "invalid observation"
        );
        let key = Key::Price(asset, timestamp);
        // Once a historical point exists it cannot be replaced, even by the fixture admin.
        assert!(
            !env.storage().persistent().has(&key),
            "immutable observation"
        );
        env.storage().persistent().set(
            &key,
            &PriceData {
                price: value,
                timestamp,
            },
        );
        env.storage()
            .persistent()
            .extend_ttl(&key, 120_960, 518_400);
        env.storage().instance().extend_ttl(120_960, 518_400);
    }
}
