use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
};
use steption_mock_oracle::{MockOracle, MockOracleClient};

struct Fixture {
    env: Env,
    options: Address,
    oracle: Address,
    token: Address,
    writer: Address,
    buyer: Address,
}
impl Fixture {
    fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|l| {
            l.timestamp = 1_800_000_000;
            l.sequence_number = 100;
        });
        let admin = Address::generate(&env);
        let writer = Address::generate(&env);
        let buyer = Address::generate(&env);
        let token = env
            .register_stellar_asset_contract_v2(admin.clone())
            .address();
        let oracle = env.register(MockOracle, (&admin,));
        let options = env.register(Options, (&admin, &token, &oracle));
        let sac = StellarAssetClient::new(&env, &token);
        sac.mint(&writer, &1_000_000_000_000);
        sac.mint(&buyer, &1_000_000_000_000);
        Self {
            env,
            options,
            oracle,
            token,
            writer,
            buyer,
        }
    }
    fn client(&self) -> OptionsClient<'_> {
        OptionsClient::new(&self.env, &self.options)
    }
    fn expiry(&self) -> u64 {
        1_800_003_600
    }
    fn series(&self, call: bool) -> u64 {
        self.client().create_series(
            &self.writer,
            &call,
            &2_000_000,
            &if call { 3_000_000 } else { 0 },
            &self.expiry(),
            &100_000,
            &100,
        )
    }
    fn buy(&self, id: u64, n: u64) -> u64 {
        self.client().buy(
            &id,
            &self.buyer,
            &n,
            &(n as i128 * 100_000),
            &(self.env.ledger().timestamp() + 180),
        )
    }
    fn observe(&self, prices: [i128; 3], usdc: i128) {
        self.env
            .ledger()
            .with_mut(|l| l.timestamp = self.expiry() + 300);
        let oracle = MockOracleClient::new(&self.env, &self.oracle);
        for (i, price) in prices.iter().enumerate() {
            let time = self.expiry() - (i as u64 + 1) * 300;
            oracle.set_price(&Asset::Other(symbol_short!("XLM")), &time, price);
            oracle.set_price(&Asset::Other(symbol_short!("USDC")), &time, &usdc);
        }
    }
    fn balance(&self, address: &Address) -> i128 {
        TokenClient::new(&self.env, &self.token).balance(address)
    }
}

#[test]
fn put_claims_conserve_reserve_in_both_orders() {
    for writer_first in [false, true] {
        let f = Fixture::new();
        let id = f.series(false);
        let p = f.buy(id, 40);
        let c = f.client();
        assert_eq!(f.balance(&f.options), 200_000_000);
        assert_eq!(c.cancel_inventory(&id, &20), 40_000_000);
        f.observe([1_000_000, 1_200_000, 1_100_000], 10_000_000);
        assert_eq!(c.settle(&id), 900_000);
        assert_eq!(c.get_series(&id).settlement_price, 1_100_000);
        let buyer_before = f.balance(&f.buyer);
        let writer_before = f.balance(&f.writer);
        if writer_first {
            assert_eq!(c.claim_writer(&id), 124_000_000);
            assert_eq!(c.claim(&p), 36_000_000);
        } else {
            assert_eq!(c.claim(&p), 36_000_000);
            assert_eq!(c.claim_writer(&id), 124_000_000);
        }
        assert_eq!(f.balance(&f.buyer) - buyer_before, 36_000_000);
        assert_eq!(f.balance(&f.writer) - writer_before, 124_000_000);
        assert_eq!(f.balance(&f.options), 0);
        assert_eq!(c.get_series(&id).reserve, 0);
        assert_eq!(c.try_claim(&p), Err(Ok(Error::AlreadyClaimed.into())));
        assert_eq!(
            c.try_claim_writer(&id),
            Err(Ok(Error::AlreadyClaimed.into()))
        );
    }
}
#[test]
fn call_and_put_payoff_boundaries() {
    for (call, spot, want) in [
        (false, 1, 1_999_999),
        (false, 2_000_000, 0),
        (false, 5_000_000, 0),
        (true, 1_000_000, 0),
        (true, 2_000_000, 0),
        (true, 2_500_000, 500_000),
        (true, 3_000_000, 1_000_000),
        (true, 50_000_000, 1_000_000),
    ] {
        let f = Fixture::new();
        let id = f.series(call);
        let p = f.buy(id, 100);
        f.observe([spot; 3], 10_000_000);
        let c = f.client();
        assert_eq!(c.settle(&id), want);
        let buyer = c.claim(&p);
        let writer = c.claim_writer(&id);
        assert_eq!(buyer + writer, if call { 100_000_000 } else { 200_000_000 });
        assert_eq!(f.balance(&f.options), 0);
    }
}
#[test]
fn live_usdc_ratio_and_keeper_timing_are_deterministic() {
    let f = Fixture::new();
    let id = f.series(false);
    f.buy(id, 10);
    f.observe([1_000_000, 1_200_000, 1_100_000], 5_000_000);
    let c = f.client();
    assert_eq!(c.settle(&id), 0);
    assert_eq!(c.get_series(&id).settlement_price, 2_200_000);
    f.env.ledger().with_mut(|l| l.timestamp += 86400 * 20);
    assert_eq!(c.settle(&id), 0);
    assert_eq!(c.get_series(&id).settlement_price, 2_200_000);
}
#[test]
fn late_first_settlement_uses_same_historical_buckets() {
    let f = Fixture::new();
    let id = f.series(false);
    f.buy(id, 10);
    f.observe([1_000_000; 3], 10_000_000);
    f.env.ledger().with_mut(|l| l.timestamp += 86400 * 3);
    assert_eq!(f.client().settle(&id), 1_000_000);
}
#[test]
fn missing_oracle_history_fails_without_releasing_collateral() {
    let f = Fixture::new();
    let id = f.series(false);
    let p = f.buy(id, 10);
    f.env.ledger().with_mut(|l| l.timestamp = f.expiry() + 300);
    let c = f.client();
    assert_eq!(c.try_settle(&id), Err(Ok(Error::Oracle.into())));
    assert_eq!(c.try_claim(&p), Err(Ok(Error::Unsettled.into())));
    assert_eq!(f.balance(&f.options), 200_000_000);
    assert!(!c.get_series(&id).settled);
}
#[test]
fn pause_blocks_new_risk_but_not_cancellation_settlement_or_claims() {
    let f = Fixture::new();
    let id = f.series(true);
    let p = f.buy(id, 20);
    let c = f.client();
    c.set_paused(&true);
    assert_eq!(
        c.try_buy(
            &id,
            &f.buyer,
            &1,
            &100_000,
            &(f.env.ledger().timestamp() + 60)
        ),
        Err(Ok(Error::Paused.into()))
    );
    assert_eq!(
        c.try_create_series(
            &f.writer,
            &false,
            &2_000_000,
            &0,
            &f.expiry(),
            &100_000,
            &100
        ),
        Err(Ok(Error::Paused.into()))
    );
    assert_eq!(c.cancel_inventory(&id, &80), 80_000_000);
    f.observe([2_500_000; 3], 10_000_000);
    c.settle(&id);
    assert_eq!(c.claim(&p), 10_000_000);
    assert_eq!(c.claim_writer(&id), 10_000_000);
}
#[test]
fn invalid_sizes_caps_expiry_and_premiums_fail() {
    let f = Fixture::new();
    let c = f.client();
    for (strike, cap, capacity, premium, expiry) in [
        (0, 0, 1, 1, f.expiry()),
        (2_000_000, 2_000_000, 1, 1, f.expiry()),
        (2_000_000, 3_000_000, 0, 1, f.expiry()),
        (2_000_000, 3_000_000, 1, 1_000_001, f.expiry()),
        (2_000_000, 3_000_000, 1, 1, f.expiry() + 1),
        (2_000_000, 3_000_000, MAX_LOTS + 1, 1, f.expiry()),
    ] {
        assert_eq!(
            c.try_create_series(&f.writer, &true, &strike, &cap, &expiry, &premium, &capacity),
            Err(Ok(Error::Invalid.into()))
        );
    }
    assert_eq!(c.series_count(), 0);
    assert_eq!(f.balance(&f.options), 0);
}
#[test]
fn buy_checks_inventory_deadline_and_max_premium() {
    let f = Fixture::new();
    let id = f.series(false);
    let c = f.client();
    let now = f.env.ledger().timestamp();
    assert_eq!(
        c.try_buy(&id, &f.buyer, &101, &100_000_000, &(now + 60)),
        Err(Ok(Error::Inventory.into()))
    );
    assert_eq!(
        c.try_buy(&id, &f.buyer, &0, &100_000_000, &(now + 60)),
        Err(Ok(Error::Inventory.into()))
    );
    assert_eq!(
        c.try_buy(&id, &f.buyer, &1, &99_999, &(now + 60)),
        Err(Ok(Error::Slippage.into()))
    );
    assert_eq!(
        c.try_buy(&id, &f.buyer, &1, &100_000, &(now - 1)),
        Err(Ok(Error::Slippage.into()))
    );
    f.buy(id, 100);
    assert_eq!(
        c.try_cancel_inventory(&id, &1),
        Err(Ok(Error::Inventory.into()))
    );
}
#[test]
fn exact_expiry_blocks_buy_and_publication_delay_blocks_settle() {
    let f = Fixture::new();
    let id = f.series(false);
    f.buy(id, 1);
    let c = f.client();
    f.env.ledger().with_mut(|l| l.timestamp = f.expiry());
    assert_eq!(
        c.try_buy(&id, &f.buyer, &1, &100_000, &(f.expiry() + 60)),
        Err(Ok(Error::Expired.into()))
    );
    assert_eq!(c.try_settle(&id), Err(Ok(Error::NotExpired.into())));
}
#[test]
fn failed_token_payment_rolls_back_inventory_and_positions() {
    let f = Fixture::new();
    let id = f.series(false);
    let empty = Address::generate(&f.env);
    let c = f.client();
    assert!(c
        .try_buy(
            &id,
            &empty,
            &1,
            &100_000,
            &(f.env.ledger().timestamp() + 60)
        )
        .is_err());
    assert_eq!(c.get_series(&id).available, 100);
    assert_eq!(c.positions_of(&empty).len(), 0);
}
#[test]
fn failed_writer_deposit_rolls_back_series() {
    let f = Fixture::new();
    let empty = Address::generate(&f.env);
    let c = f.client();
    assert!(c
        .try_create_series(&empty, &false, &2_000_000, &0, &f.expiry(), &100_000, &10)
        .is_err());
    assert_eq!(c.series_count(), 0);
}
#[test]
fn no_buyer_exposure_can_settle_without_oracle() {
    let f = Fixture::new();
    let id = f.series(false);
    f.env.ledger().with_mut(|l| l.timestamp = f.expiry() + 300);
    let c = f.client();
    assert_eq!(c.settle(&id), 0);
    assert_eq!(c.claim_writer(&id), 200_000_000);
}
#[test]
fn authentication_is_required_for_writer_buyer_and_admin() {
    let f = Fixture::new();
    let id = f.series(false);
    f.env.set_auths(&[]);
    let c = f.client();
    assert!(c.try_set_paused(&true).is_err());
    assert!(c.try_cancel_inventory(&id, &1).is_err());
    assert!(c
        .try_create_series(&f.writer, &false, &2_000_000, &0, &f.expiry(), &100_000, &1)
        .is_err());
    assert!(c
        .try_buy(
            &id,
            &f.buyer,
            &1,
            &100_000,
            &(f.env.ledger().timestamp() + 60)
        )
        .is_err());
}
#[test]
fn permissionless_claims_pay_recorded_owner() {
    let f = Fixture::new();
    let id = f.series(false);
    let p = f.buy(id, 10);
    f.observe([1_000_000; 3], 10_000_000);
    let c = f.client();
    c.settle(&id);
    f.env.set_auths(&[]);
    let before = f.balance(&f.buyer);
    assert_eq!(c.claim(&p), 10_000_000);
    assert_eq!(f.balance(&f.buyer) - before, 10_000_000);
    assert_eq!(c.claim_writer(&id), 190_000_000);
}
#[test]
fn supply_fuzz_conserves_every_atom() {
    for n in [1, 2, 3, 7, 11, 49, 99, 100] {
        for spot in [
            1, 999_999, 1_234_567, 1_999_999, 2_000_000, 2_999_999, 3_000_000, 9_999_999,
        ] {
            let f = Fixture::new();
            let id = f.series(true);
            let p = f.buy(id, n);
            let cancelled = if n < 100 {
                f.client().cancel_inventory(&id, &(100 - n))
            } else {
                0
            };
            f.observe([spot; 3], 10_000_000);
            let c = f.client();
            c.settle(&id);
            let paid = c.claim(&p);
            let returned = c.claim_writer(&id);
            assert_eq!(cancelled + paid + returned, 100_000_000);
            assert_eq!(f.balance(&f.options), 0);
        }
    }
}

#[test]
fn trading_stops_before_first_oracle_observation() {
    let f = Fixture::new();
    let id = f.series(false);
    f.env.ledger().with_mut(|l| l.timestamp = f.expiry() - 900);
    let c = f.client();
    assert_eq!(
        c.try_buy(
            &id,
            &f.buyer,
            &1,
            &100_000,
            &(f.env.ledger().timestamp() + 60)
        ),
        Err(Ok(Error::Expired.into()))
    );
}

// Deliberately malformed provider responses exercise the consumer, not the good mock.
#[contract]
struct BrokenOracle;
fn mode(e: &Env) -> u32 {
    e.storage().instance().get(&0u32).unwrap_or(0)
}
#[contractimpl]
impl BrokenOracle {
    pub fn set_mode(e: Env, value: u32) {
        e.storage().instance().set(&0u32, &value);
    }
    pub fn base(e: Env) -> Asset {
        Asset::Other(if mode(&e) == 4 {
            symbol_short!("EUR")
        } else {
            symbol_short!("USD")
        })
    }
    pub fn assets(e: Env) -> Vec<Asset> {
        soroban_sdk::vec![
            &e,
            Asset::Other(symbol_short!("XLM")),
            Asset::Other(symbol_short!("USDC"))
        ]
    }
    pub fn decimals(e: Env) -> u32 {
        if mode(&e) == 5 {
            8
        } else {
            7
        }
    }
    pub fn resolution(e: Env) -> u32 {
        if mode(&e) == 6 {
            600
        } else {
            300
        }
    }
    pub fn price(e: Env, _asset: Asset, timestamp: u64) -> Option<oracle_interface::PriceData> {
        let m = mode(&e);
        Some(oracle_interface::PriceData {
            price: match m {
                1 => 0,
                2 => -1,
                7 => 1_000_000_000_000_000_000_000_001,
                _ => 10_000_000,
            },
            timestamp: if m == 3 { timestamp + 1 } else { timestamp },
        })
    }
}
#[test]
fn rejects_malformed_prices_timestamps_and_changed_metadata() {
    for invalid in 1..=7 {
        let f = Fixture::new();
        let admin = Address::generate(&f.env);
        let oracle = f.env.register(BrokenOracle, ());
        let options = f.env.register(Options, (&admin, &f.token, &oracle));
        let c = OptionsClient::new(&f.env, &options);
        let id = c.create_series(
            &f.writer,
            &false,
            &2_000_000,
            &0,
            &f.expiry(),
            &100_000,
            &10,
        );
        c.buy(
            &id,
            &f.buyer,
            &1,
            &100_000,
            &(f.env.ledger().timestamp() + 60),
        );
        f.env.ledger().with_mut(|l| l.timestamp = f.expiry() + 300);
        BrokenOracleClient::new(&f.env, &oracle).set_mode(&invalid);
        assert_eq!(c.try_settle(&id), Err(Ok(Error::Oracle.into())));
        assert!(!c.get_series(&id).settled);
        assert_eq!(
            TokenClient::new(&f.env, &f.token).balance(&options),
            20_000_000
        );
    }
}
