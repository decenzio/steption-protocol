#![no_std]
//! Unaudited testnet MVP. Nontransferable 1-XLM lots, fixed premiums, USDC reserves.
//! Prices and token transfers use 7 decimals. No floating point or external pricing model.
use oracle_interface::{Asset, OracleClient};
use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, panic_with_error,
    symbol_short, token, Address, Env, Symbol, Vec,
};
const SCALE: i128 = 10_000_000;
const MAX_PRICE: i128 = 1_000_000_000_000;
const MAX_LOTS: u64 = 1_000_000_000;

const MAX_POSITIONS: u32 = 256;
const TTL_THRESHOLD: u32 = 120_960;
const TTL_EXTEND: u32 = 518_400;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    Invalid = 1,
    Paused = 2,
    Missing = 3,
    Expired = 4,
    Inventory = 5,
    Slippage = 6,
    NotExpired = 7,
    Oracle = 8,
    AlreadyClaimed = 9,
    Unsettled = 10,
    Limit = 11,
    Arithmetic = 12,
}
#[contracttype]
#[derive(Clone, Debug)]
pub struct Config {
    pub admin: Address,
    pub token: Address,
    pub oracle: Address,
    pub paused: bool,
    pub resolution: u64,
    pub oracle_decimals: u32,
}
#[contracttype]
#[derive(Clone, Debug)]
pub struct Series {
    pub id: u64,
    pub writer: Address,
    pub is_call: bool,
    pub strike: i128,
    pub cap: i128,
    pub expiry: u64,
    pub premium: i128,
    pub available: u64,
    pub sold: u64,
    pub reserve: i128,
    pub settled: bool,
    pub settlement_price: i128,
    pub payout: i128,
    pub liability: i128,
    pub writer_claimed: bool,
}
#[contracttype]
#[derive(Clone, Debug)]
pub struct Position {
    pub id: u64,
    pub series_id: u64,
    pub buyer: Address,
    pub quantity: u64,
    pub premium_paid: i128,
    pub claimed: bool,
}
#[contracttype]
#[derive(Clone)]
enum Key {
    Config,
    SeriesCount,
    PositionCount,
    Series(u64),
    Position(u64),
    Owner(Address),
    Writer(Address),
}
#[contractevent]
pub struct ProtocolEvent {
    #[topic]
    pub action: Symbol,
    #[topic]
    pub id: u64,
    pub amount: i128,
}
#[contract]
pub struct Options;

fn require(env: &Env, condition: bool, error: Error) {
    if !condition {
        panic_with_error!(env, error);
    }
}
fn mul(env: &Env, a: i128, b: i128) -> i128 {
    a.checked_mul(b)
        .unwrap_or_else(|| panic_with_error!(env, Error::Arithmetic))
}
fn sub(env: &Env, a: i128, b: i128) -> i128 {
    a.checked_sub(b)
        .unwrap_or_else(|| panic_with_error!(env, Error::Arithmetic))
}
fn config(env: &Env) -> Config {
    env.storage()
        .instance()
        .extend_ttl(TTL_THRESHOLD, TTL_EXTEND);
    env.storage().instance().get(&Key::Config).unwrap()
}
fn touch(env: &Env, key: &Key) {
    env.storage()
        .persistent()
        .extend_ttl(key, TTL_THRESHOLD, TTL_EXTEND);
}
fn get_series(env: &Env, id: u64) -> Series {
    let key = Key::Series(id);
    let result = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| panic_with_error!(env, Error::Missing));
    touch(env, &key);
    result
}
fn get_position(env: &Env, id: u64) -> Position {
    let key = Key::Position(id);
    let result = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| panic_with_error!(env, Error::Missing));
    touch(env, &key);
    result
}
fn save_series(env: &Env, s: &Series) {
    let key = Key::Series(s.id);
    env.storage().persistent().set(&key, s);
    touch(env, &key);
}
fn save_position(env: &Env, p: &Position) {
    let key = Key::Position(p.id);
    env.storage().persistent().set(&key, p);
    touch(env, &key);
}
fn unit(s: &Series) -> i128 {
    if s.is_call {
        s.cap - s.strike
    } else {
        s.strike
    }
}
fn transfer(env: &Env, c: &Config, to: &Address, amount: i128) {
    if amount > 0 {
        token::Client::new(env, &c.token).transfer(&env.current_contract_address(), to, &amount);
    }
}
fn event(env: &Env, action: Symbol, id: u64, amount: i128) {
    ProtocolEvent { action, id, amount }.publish(env);
}
fn ratio(env: &Env, oracle: &OracleClient, timestamp: u64) -> i128 {
    let xlm = oracle
        .price(&Asset::Other(symbol_short!("XLM")), &timestamp)
        .unwrap_or_else(|| panic_with_error!(env, Error::Oracle));
    let usdc = oracle
        .price(&Asset::Other(symbol_short!("USDC")), &timestamp)
        .unwrap_or_else(|| panic_with_error!(env, Error::Oracle));
    require(
        env,
        xlm.timestamp == timestamp
            && usdc.timestamp == timestamp
            && timestamp <= env.ledger().timestamp(),
        Error::Oracle,
    );
    let limit: i128 = 1_000_000_000_000_000_000_000_000;
    require(
        env,
        xlm.price > 0 && usdc.price > 0 && xlm.price <= limit && usdc.price <= limit,
        Error::Oracle,
    );
    // Both feeds have the same declared decimals. They cancel in the ratio.
    // Round DOWN once per lot; whole lots make aggregate payout exactly additive.
    let price = mul(env, xlm.price, SCALE) / usdc.price;
    require(env, price > 0 && price <= MAX_PRICE, Error::Oracle);
    price
}

#[contractimpl]
impl Options {
    pub fn __constructor(env: Env, admin: Address, collateral_token: Address, oracle: Address) {
        let client = OracleClient::new(&env, &oracle);
        let resolution = client.resolution() as u64;
        let decimals = client.decimals();
        require(
            &env,
            resolution > 0 && resolution <= 86400 && decimals <= 18,
            Error::Oracle,
        );
        require(
            &env,
            client.base() == Asset::Other(symbol_short!("USD")),
            Error::Oracle,
        );
        let assets = client.assets();
        require(
            &env,
            assets.contains(&Asset::Other(symbol_short!("XLM")))
                && assets.contains(&Asset::Other(symbol_short!("USDC"))),
            Error::Oracle,
        );
        require(
            &env,
            token::Client::new(&env, &collateral_token).decimals() == 7,
            Error::Invalid,
        );
        env.storage().instance().set(
            &Key::Config,
            &Config {
                admin,
                token: collateral_token,
                oracle,
                paused: false,
                resolution,
                oracle_decimals: decimals,
            },
        );
        env.storage().instance().set(&Key::SeriesCount, &0u64);
        env.storage().instance().set(&Key::PositionCount, &0u64);
    }
    pub fn get_config(env: Env) -> Config {
        config(&env)
    }
    pub fn series_count(env: Env) -> u64 {
        config(&env);
        env.storage().instance().get(&Key::SeriesCount).unwrap()
    }
    pub fn get_series(env: Env, id: u64) -> Series {
        config(&env);
        get_series(&env, id)
    }
    pub fn get_position(env: Env, id: u64) -> Position {
        config(&env);
        get_position(&env, id)
    }
    pub fn positions_of(env: Env, owner: Address) -> Vec<u64> {
        config(&env);
        let key = Key::Owner(owner);
        if env.storage().persistent().has(&key) {
            touch(&env, &key);
        }
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(Vec::new(&env))
    }
    pub fn written_by(env: Env, owner: Address) -> Vec<u64> {
        config(&env);
        let key = Key::Writer(owner);
        if env.storage().persistent().has(&key) {
            touch(&env, &key);
        }
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(Vec::new(&env))
    }
    pub fn set_paused(env: Env, paused: bool) {
        let mut c = config(&env);
        c.admin.require_auth();
        c.paused = paused;
        env.storage().instance().set(&Key::Config, &c);
        event(&env, symbol_short!("paused"), 0, if paused { 1 } else { 0 });
    }

    pub fn create_series(
        env: Env,
        writer: Address,
        is_call: bool,
        strike: i128,
        cap: i128,
        expiry: u64,
        premium: i128,
        capacity: u64,
    ) -> u64 {
        writer.require_auth();
        let c = config(&env);
        require(&env, !c.paused, Error::Paused);
        require(
            &env,
            strike > 0
                && strike <= MAX_PRICE
                && premium > 0
                && capacity > 0
                && capacity <= MAX_LOTS,
            Error::Invalid,
        );
        require(
            &env,
            if is_call {
                cap > strike && cap <= MAX_PRICE
            } else {
                cap == 0
            },
            Error::Invalid,
        );
        let now = env.ledger().timestamp();
        require(
            &env,
            expiry >= now + 4 * c.resolution
                && expiry <= now + 365 * 86400
                && expiry % c.resolution == 0,
            Error::Invalid,
        );
        let count: u64 = env.storage().instance().get(&Key::SeriesCount).unwrap();
        let id = count
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Limit));
        let writer_key = Key::Writer(writer.clone());
        let mut writer_ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&writer_key)
            .unwrap_or(Vec::new(&env));
        require(&env, writer_ids.len() < MAX_POSITIONS, Error::Limit);
        writer_ids.push_back(id);
        env.storage().persistent().set(&writer_key, &writer_ids);
        touch(&env, &writer_key);
        let max_payout = if is_call { cap - strike } else { strike };
        require(&env, premium <= max_payout, Error::Invalid);
        let reserve = mul(&env, max_payout, capacity as i128);
        let s = Series {
            id,
            writer: writer.clone(),
            is_call,
            strike,
            cap,
            expiry,
            premium,
            available: capacity,
            sold: 0,
            reserve,
            settled: false,
            settlement_price: 0,
            payout: 0,
            liability: 0,
            writer_claimed: false,
        };
        env.storage().instance().set(&Key::SeriesCount, &id);
        save_series(&env, &s);
        token::Client::new(&env, &c.token).transfer(
            &writer,
            &env.current_contract_address(),
            &reserve,
        );
        event(&env, symbol_short!("created"), id, reserve);
        id
    }
    pub fn buy(
        env: Env,
        series_id: u64,
        buyer: Address,
        quantity: u64,
        max_premium: i128,
        deadline: u64,
    ) -> u64 {
        buyer.require_auth();
        let c = config(&env);
        require(&env, !c.paused, Error::Paused);
        let mut s = get_series(&env, series_id);
        let now = env.ledger().timestamp();
        require(
            &env,
            !s.settled && now < s.expiry - 3 * c.resolution,
            Error::Expired,
        );
        require(
            &env,
            deadline >= now && deadline <= now + 600,
            Error::Slippage,
        );
        require(
            &env,
            quantity > 0 && quantity <= s.available,
            Error::Inventory,
        );
        let payment = mul(&env, s.premium, quantity as i128);
        require(&env, max_premium >= payment, Error::Slippage);
        let key = Key::Owner(buyer.clone());
        let mut ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(Vec::new(&env));
        require(&env, ids.len() < MAX_POSITIONS, Error::Limit);
        let count: u64 = env.storage().instance().get(&Key::PositionCount).unwrap();
        let id = count
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Limit));
        let p = Position {
            id,
            series_id,
            buyer: buyer.clone(),
            quantity,
            premium_paid: payment,
            claimed: false,
        };
        s.available -= quantity;
        s.sold += quantity;
        save_series(&env, &s);
        save_position(&env, &p);
        ids.push_back(id);
        env.storage().persistent().set(&key, &ids);
        touch(&env, &key);
        env.storage().instance().set(&Key::PositionCount, &id);
        token::Client::new(&env, &c.token).transfer(&buyer, &s.writer, &payment);
        event(&env, symbol_short!("bought"), id, payment);
        id
    }
    pub fn cancel_inventory(env: Env, series_id: u64, quantity: u64) -> i128 {
        let c = config(&env);
        let mut s = get_series(&env, series_id);
        s.writer.require_auth();
        require(
            &env,
            !s.settled && quantity > 0 && quantity <= s.available,
            Error::Inventory,
        );
        let refund = mul(&env, unit(&s), quantity as i128);
        s.available -= quantity;
        s.reserve = sub(&env, s.reserve, refund);
        save_series(&env, &s);
        transfer(&env, &c, &s.writer, refund);
        event(&env, symbol_short!("cancel"), series_id, refund);
        refund
    }
    pub fn settle(env: Env, series_id: u64) -> i128 {
        let c = config(&env);
        let mut s = get_series(&env, series_id);
        if s.settled {
            return s.payout;
        }
        require(
            &env,
            env.ledger().timestamp() >= s.expiry + c.resolution,
            Error::NotExpired,
        );
        // No sold exposure needs no price. All remaining collateral belongs to the writer.
        if s.sold == 0 {
            s.settled = true;
            save_series(&env, &s);
            event(&env, symbol_short!("settled"), series_id, 0);
            return 0;
        }
        let oracle = OracleClient::new(&env, &c.oracle);
        require(
            &env,
            oracle.resolution() as u64 == c.resolution
                && oracle.decimals() == c.oracle_decimals
                && oracle.base() == Asset::Other(symbol_short!("USD")),
            Error::Oracle,
        );
        require(&env, s.expiry >= 3 * c.resolution, Error::Oracle);
        // Three fixed completed buckets. Keeper timing never shifts the sample timestamps.
        let a = ratio(&env, &oracle, s.expiry - c.resolution);
        let b = ratio(&env, &oracle, s.expiry - 2 * c.resolution);
        let d = ratio(&env, &oracle, s.expiry - 3 * c.resolution);
        let price = if a > b {
            if b > d {
                b
            } else if a > d {
                d
            } else {
                a
            }
        } else if a > d {
            a
        } else if b > d {
            d
        } else {
            b
        };
        let gross = if s.is_call {
            if price > s.strike {
                (price - s.strike).min(s.cap - s.strike)
            } else {
                0
            }
        } else if price < s.strike {
            s.strike - price
        } else {
            0
        };
        s.liability = mul(&env, gross, s.sold as i128);
        require(&env, s.liability <= s.reserve, Error::Arithmetic);
        s.settled = true;
        s.settlement_price = price;
        s.payout = gross;
        save_series(&env, &s);
        event(&env, symbol_short!("settled"), series_id, price);
        gross
    }
    pub fn claim(env: Env, position_id: u64) -> i128 {
        let c = config(&env);
        let mut p = get_position(&env, position_id);
        let mut s = get_series(&env, p.series_id);
        require(&env, s.settled, Error::Unsettled);
        require(&env, !p.claimed, Error::AlreadyClaimed);
        let amount = mul(&env, s.payout, p.quantity as i128);
        p.claimed = true;
        s.reserve = sub(&env, s.reserve, amount);
        s.liability = sub(&env, s.liability, amount);
        save_position(&env, &p);
        save_series(&env, &s);
        transfer(&env, &c, &p.buyer, amount);
        event(&env, symbol_short!("claimed"), position_id, amount);
        amount
    }
    pub fn claim_writer(env: Env, series_id: u64) -> i128 {
        let c = config(&env);
        let mut s = get_series(&env, series_id);
        require(&env, s.settled, Error::Unsettled);
        require(&env, !s.writer_claimed, Error::AlreadyClaimed);
        let amount = sub(&env, s.reserve, s.liability);
        s.reserve = s.liability;
        s.writer_claimed = true;
        save_series(&env, &s);
        transfer(&env, &c, &s.writer, amount);
        event(&env, symbol_short!("returned"), series_id, amount);
        amount
    }
}

#[cfg(test)]
mod test;
