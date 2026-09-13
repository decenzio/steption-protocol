"use client";

import Link from "next/link";
import { learnSteps, learnFaqs } from "../lib/content";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Layers3,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Wallet,
  X,
} from "lucide-react";
import * as stellar from "../lib/stellar";
import { atoms, decimal, lots, payout } from "../lib/amount";
import { sampleSeries } from "../lib/sample";
import type { Config, Position, Series, View } from "../lib/types";

const money = (value: bigint, precision = 2) =>
  Number(decimal(value)).toLocaleString("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
const date = (value: bigint) =>
  new Date(Number(value) * 1000).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
const time = (value: bigint) =>
  new Date(Number(value) * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
const short = (value: string) =>
  value.length > 20 ? `${value.slice(0, 5)}…${value.slice(-5)}` : value;
const errorText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
const title: Record<View, string> = {
  markets: "Options markets",
  portfolio: "Your portfolio",
  liquidity: "Write options",
  settlement: "Settlement",
  learn: "Understand your options",
};
const subtitle: Record<View, string> = {
  markets: "Find your position. Define your risk.",
  portfolio: "Your positions, premiums and settlement claims.",
  liquidity: "Set your terms. Back every option with collateral.",
  settlement: "Finalize expired series and claim your settlement.",
  learn: "A clear view of how Steption works.",
};
const paperKey = "steption:paper-positions:v1";

function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark ${small ? "small" : ""}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
function Coin({ pair = false }: { pair?: boolean }) {
  return (
    <span className={`coin-wrap ${pair ? "pair" : ""}`}>
      <span className="coin">X</span>
      {pair && <span className="coin usdc">$</span>}
    </span>
  );
}
function Tag({ series }: { series: Series }) {
  return (
    <span className={`tag ${series.is_call ? "call" : "put"}`}>
      {series.is_call ? (
        <ArrowUpRight size={13} />
      ) : (
        <ArrowDownLeft size={13} />
      )}{" "}
      {series.is_call ? "Capped call" : "Put"}
    </span>
  );
}
function Payoff({
  series,
  quantity = 1n,
}: {
  series: Series;
  quantity?: bigint;
}) {
  const upper = Number(
    decimal(series.is_call ? (series.cap * 3n) / 2n : series.strike * 2n),
  );
  const pts = Array.from({ length: 61 }, (_, i) => {
    const spot = BigInt(Math.round(((upper * i) / 60) * 1e7));
    return {
      x: 22 + i * 4.7,
      y: Number(
        decimal(
          (payout(series.is_call, series.strike, series.cap, spot) -
            series.premium) *
            quantity,
        ),
      ),
    };
  });
  const max = Math.max(...pts.map((p) => p.y), 0.001),
    min = Math.min(...pts.map((p) => p.y), -0.001),
    height = max - min;
  const y = (v: number) => 16 + ((max - v) / height) * 105;
  return (
    <div className="payoff">
      <div className="row">
        <span>Net payoff at expiry</span>
        <span className="muted">USDC</span>
      </div>
      <svg
        viewBox="0 0 326 151"
        role="img"
        aria-label={`Net payoff for ${quantity} ${series.is_call ? "capped call" : "put"} lots after premium. Maximum loss ${money(series.premium * quantity)} USDC.`}
      >
        <line
          x1="22"
          x2="304"
          y1={y(0)}
          y2={y(0)}
          stroke="var(--line)"
          strokeDasharray="3 4"
        />
        <polyline
          points={pts.map((p) => `${p.x},${y(p.y)}`).join(" ")}
          fill="none"
          stroke="var(--yellow)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <text x="22" y="144">
          $0
        </text>
        <text x="255" y="144">
          ${upper.toFixed(2)} XLM
        </text>
      </svg>
      <div className="row fine">
        <span>Includes option premium</span>
        <span>Excludes network fee</span>
      </div>
    </div>
  );
}

export default function Terminal({ view }: { view: View }) {
  const [series, setSeries] = useState<Series[]>([]),
    [positions, setPositions] = useState<Position[]>([]),
    [config, setConfig] = useState<Config | null>(null);
  const [nextPage, setNextPage] = useState(0n);
  const ownerRef = useRef(""),
    refreshId = useRef(0),
    busyRef = useRef(false);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [hash, setHash] = useState(""),
    [busy, setBusy] = useState(false);
  const [address, setAddress] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [favorites, setFavorites] = useState<string[]>([]),
    [onlyFavorites, setOnlyFavorites] = useState(false),
    [sort, setSort] = useState("expiry");
  const [selected, setSelected] = useState<Series | null>(null),
    [quantity, setQuantity] = useState("1000"),
    [review, setReview] = useState(false),
    [showWrite, setShowWrite] = useState(false),
    [networkVersion, setNetworkVersion] = useState<string | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const drawer = useRef<HTMLDialogElement>(null),
    writerDialog = useRef<HTMLDialogElement>(null);
  const refresh = useCallback(async () => {
    const generation = ++refreshId.current;
    const owner = ownerRef.current;
    setLoading(true);
    setError("");
    try {
      if (stellar.configurationError())
        throw new Error(stellar.configurationError());
      if (stellar.isPreview) {
        let base = Number(localStorage.getItem("steption:sample-base"));
        if (!base) {
          base = Math.floor(Date.now() / 86400000) * 86400;
          localStorage.setItem("steption:sample-base", String(base));
        }
        setSeries(sampleSeries(base));
        const saved = localStorage.getItem(paperKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setPositions(
              parsed.map((p: Record<string, string | boolean>) => ({
                ...p,
                id: BigInt(p.id),
                series_id: BigInt(p.series_id),
                quantity: BigInt(p.quantity),
                premium_paid: BigInt(p.premium_paid),
              })),
            );
          } catch {
            localStorage.removeItem(paperKey);
            setPositions([]);
          }
        }
      } else {
        const [data, network, owned, written] = await Promise.all([
          stellar.loadMarkets(),
          stellar.networkInfo(),
          owner ? stellar.loadPositions(owner) : Promise.resolve([]),
          owner ? stellar.loadWritten(owner) : Promise.resolve([]),
        ]);
        const known = new Set(
          [...data.series, ...written].map((s) => String(s.id)),
        );
        const missing = [...new Set(owned.map((p) => String(p.series_id)))]
          .filter((id) => !known.has(id))
          .map(BigInt);
        const associated = await stellar.loadSeries(missing);
        if (generation !== refreshId.current || owner !== ownerRef.current)
          return;
        const all = [...data.series, ...written, ...associated];
        setSeries([...new Map(all.map((s) => [String(s.id), s])).values()]);
        setConfig(data.config);
        setNextPage(data.next);
        setNetworkVersion(String(network.protocolVersion));
        setPositions(owned);
      }
    } catch (e) {
      if (generation === refreshId.current) {
        setError(errorText(e));
        setSeries([]);
      }
    } finally {
      if (generation === refreshId.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(refresh);
    const generation = refreshId;
    return () => {
      generation.current++;
    };
  }, [refresh]);
  useEffect(() => {
    let cancelled = false;
    const saved = localStorage.getItem("steption:wallet");
    if (saved)
      void stellar
        .verifyWallet(saved)
        .then((wallet) => {
          if (!cancelled) {
            ownerRef.current = wallet;
            setAddress(wallet);
            void refresh();
          }
        })
        .catch(() => localStorage.removeItem("steption:wallet"));
    return () => {
      cancelled = true;
    };
  }, [refresh]);
  useEffect(() => {
    const timer = setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      10000,
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (selected) {
      drawer.current?.showModal();
    } else drawer.current?.close();
  }, [selected]);
  useEffect(() => {
    if (showWrite) writerDialog.current?.showModal();
    else writerDialog.current?.close();
  }, [showWrite]);
  const transact = async (action: () => Promise<unknown>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    setHash("");
    try {
      await action();
      await refresh();
    } catch (e) {
      setError(errorText(e));
      setNotice("");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const progress = (message: string, txHash?: string) => {
    setNotice(message);
    if (txHash) setHash(txHash);
  };
  const connect = () =>
    transact(async () => {
      const wallet = await stellar.connectWallet();
      ownerRef.current = wallet;
      setAddress(wallet);
      localStorage.setItem("steption:wallet", wallet);
      setNotice("Freighter connected to Testnet.");
    });
  const open = (s: Series) => {
    setReview(false);
    setSelected(s);
    setQuantity("1000");
    setNotice("");
    setError("");
    setHash("");
  };
  const openSeries = series.filter(
    (s) =>
      !s.settled &&
      Number(s.expiry) - 3 * Number(config?.resolution ?? 300n) > now &&
      s.available > 0n,
  );
  const filtered = openSeries
    .filter(
      (s) =>
        (filter === "all" || (filter === "call" ? s.is_call : !s.is_call)) &&
        (!onlyFavorites || favorites.includes(String(s.id))) &&
        `XLM USDC ${s.is_call ? "capped call" : "put"} ${decimal(s.strike)} ${date(s.expiry)}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "premium"
        ? Number(a.premium - b.premium)
        : sort === "strike"
          ? Number(a.strike - b.strike)
          : Number(a.expiry - b.expiry),
    );
  const totalReserve = series.reduce((sum, s) => sum + s.reserve, 0n);
  let qty = 0n;
  try {
    qty = lots(quantity);
  } catch {}
  const purchase = () =>
    transact(async () => {
      if (!selected) return;
      const count = lots(quantity);
      if (count > selected.available)
        throw new Error("Quantity exceeds available inventory.");
      if (stellar.isPreview) {
        const next = [
          ...positions,
          {
            id: BigInt(Date.now()),
            series_id: selected.id,
            buyer: "paper",
            quantity: count,
            premium_paid: selected.premium * count,
            claimed: false,
          },
        ];
        localStorage.setItem(
          paperKey,
          JSON.stringify(next, (_, v) =>
            typeof v === "bigint" ? v.toString() : v,
          ),
        );
        setPositions(next);
        setNotice("Paper trade saved. No transaction was sent.");
        setSelected(null);
      } else {
        if (!address) throw new Error("Connect Freighter to continue.");
        await stellar.buy(address, selected, count, progress);
        setSelected(null);
      }
    });
  const toggleFavorite = (id: bigint) =>
    setFavorites((prev) =>
      prev.includes(String(id))
        ? prev.filter((x) => x !== String(id))
        : [...prev, String(id)],
    );
  const mySeries = series.filter((s) => s.writer === address);
  const actionAllowed = !stellar.isPreview && !!address && !busy;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Steption home">
          <Mark />
          <span>
            steption<span className="brand-period">.</span>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          {(
            [
              ["markets", "Markets"],
              ["portfolio", "Portfolio"],
              ["liquidity", "Write options"],
              ["settlement", "Settlement"],
              ["learn", "Learn"],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key}
              href={key === "markets" ? "/app" : `/${key}`}
              className={view === key ? "active" : ""}
              aria-current={view === key ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <span className="network">
            <span className="network-dot" />
            Testnet
            <ChevronDown size={12} />
          </span>
          <button
            className="button connect"
            onClick={
              address
                ? () => {
                    ownerRef.current = "";
                    refreshId.current++;
                    setAddress("");
                    setPositions([]);
                    localStorage.removeItem("steption:wallet");
                    setNotice("Wallet disconnected.");
                  }
                : connect
            }
            disabled={busy}
          >
            <Wallet size={15} />
            {address ? short(address) : "Connect wallet"}
          </button>
        </div>
      </header>
      <div className="environment-bar">
        <span>
          <span className="mini-label">
            {stellar.isPreview ? "PREVIEW" : "TESTNET"}
          </span>
          {stellar.isPreview
            ? "Explore sample markets. Paper trades use no funds."
            : "Test assets only · European settlement · Fully reserved collateral"}
        </span>
        <Link href="/learn">
          How it works <ArrowUpRight size={13} />
        </Link>
      </div>
      <main id="main" className="main">
        <div className="page-heading">
          <div>
            <div className="eyebrow">STELLAR OPTIONS PROTOCOL</div>
            <h1>{title[view]}</h1>
            <p>{subtitle[view]}</p>
          </div>
          <div className="heading-right">
            <span className="protocol-badge">
              <Mark small />
              Built on Stellar
            </span>
            <button
              className="icon-button"
              aria-label="Refresh markets"
              onClick={refresh}
              disabled={loading || busy}
            >
              <RefreshCw size={16} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>
        {(notice || error) && (
          <div
            className={`feedback ${error ? "error" : ""}`}
            role={error ? "alert" : "status"}
          >
            {busy && <LoaderCircle size={16} className="spin" />}
            <span>{error || notice}</span>
            {hash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
              >
                View transaction <ExternalLink size={13} />
              </a>
            )}
            <button
              className="icon-button"
              aria-label="Dismiss message"
              onClick={() => {
                setError("");
                setNotice("");
              }}
              disabled={busy}
            >
              <X size={15} />
            </button>
          </div>
        )}
        {view === "markets" && (
          <>
            <div className="overview-grid">
              <section className="overview primary-overview">
                <div className="row">
                  <span className="eyebrow">ONE NETWORK. DEFINED RISK.</span>
                  <ShieldCheck size={19} />
                </div>
                <h2>
                  A different way
                  <br />
                  to hold your ground.
                </h2>
                <p>
                  Trade XLM puts and capped calls.
                  <br />
                  Every lot backed before you buy.
                </p>
                <Link href="/learn">
                  Explore the mechanics <ArrowUpRight size={16} />
                </Link>
                <div className="orbit-lines" aria-hidden="true" />
              </section>
              <section className="overview">
                <div className="row">
                  <span className="muted">
                    {stellar.isPreview
                      ? "Sample collateral"
                      : "Loaded market collateral"}
                  </span>
                  <Layers3 size={16} />
                </div>
                <div className="stat">
                  {money(totalReserve)} <small>USDC</small>
                </div>
                <div className="meter">
                  <i style={{ width: "100%" }} />
                </div>
                <div className="row fine">
                  <span>Upfront maximum payout</span>
                  <span>100% reserved</span>
                </div>
                <div className="stat-foot">
                  <span className="stat-icon">
                    <ShieldCheck size={16} />
                  </span>
                  <div>
                    No margin calls<span>Collateral stays in the contract</span>
                  </div>
                </div>
              </section>
              <section className="overview">
                <div className="row">
                  <span className="muted">
                    {stellar.isPreview ? "Sample markets" : "Open markets"}
                  </span>
                  <ArrowUpRight size={16} />
                </div>
                <div className="stat">
                  {openSeries.length.toString().padStart(2, "0")}{" "}
                  <small>series</small>
                </div>
                <div className="market-pair">
                  <Coin pair />
                  <div>
                    XLM / USDC<span>One pair. Two directions.</span>
                  </div>
                </div>
                <div className="row stat-foot">
                  <span className="tag put">Downside protection</span>
                  <span className="tag call">Capped upside</span>
                </div>
              </section>
            </div>
            <div className="market-toolbar">
              <div className="segmented" aria-label="Option type">
                {[
                  ["all", "All markets"],
                  ["put", "Puts"],
                  ["call", "Capped calls"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    className={filter === key ? "selected" : ""}
                    onClick={() => setFilter(key)}
                    aria-pressed={filter === key}
                  >
                    {label}
                    {key === "all" && <span>{openSeries.length}</span>}
                  </button>
                ))}
              </div>
              <label className="search">
                <Search size={16} />
                <input
                  aria-label="Search markets"
                  placeholder="Search asset, strike or expiry"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <kbd>/</kbd>
              </label>
            </div>
            <div className="filter-row">
              <button
                className={`filter-chip ${onlyFavorites ? "chosen" : ""}`}
                aria-pressed={onlyFavorites}
                onClick={() => setOnlyFavorites(!onlyFavorites)}
              >
                <Star size={14} />
                Favorites
              </button>
              <span className="filter-chip static">
                <Coin />
                XLM / USDC
              </span>
              <span className="filter-chip static">European</span>
              <span className="filter-chip static">Cash settled</span>
              <label className="sort">
                <SlidersHorizontal size={14} />
                <select
                  aria-label="Sort markets"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="expiry">Expiry: soonest</option>
                  <option value="premium">Premium: lowest</option>
                  <option value="strike">Strike: lowest</option>
                </select>
              </label>
            </div>
            <div className="table-container">
              <table className="markets-table">
                <thead>
                  <tr>
                    <th aria-label="Favorite" />
                    <th>Market</th>
                    <th>
                      Expiry <ChevronDown size={12} />
                    </th>
                    <th>Strike / cap</th>
                    <th>
                      Premium <CircleHelp size={12} />
                    </th>
                    <th>Available</th>
                    <th>Collateral / lot</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={String(s.id)}>
                      <td>
                        <button
                          className={`star-button ${favorites.includes(String(s.id)) ? "starred" : ""}`}
                          onClick={() => toggleFavorite(s.id)}
                          aria-label={`Favorite market ${s.id}`}
                          aria-pressed={favorites.includes(String(s.id))}
                        >
                          <Star size={16} />
                        </button>
                      </td>
                      <td>
                        <button className="market-name" onClick={() => open(s)}>
                          <Coin pair />
                          <span>
                            <strong>XLM / USDC</strong>
                            <Tag series={s} />
                          </span>
                        </button>
                      </td>
                      <td>
                        <strong>{date(s.expiry)}</strong>
                        <span className="sub">
                          {Math.max(
                            0,
                            Math.ceil((Number(s.expiry) - now) / 86400),
                          )}{" "}
                          days · {time(s.expiry)} UTC
                        </span>
                      </td>
                      <td>
                        <strong>${money(s.strike, 2)}</strong>
                        <span className="sub">
                          {s.is_call
                            ? `Cap $${money(s.cap, 2)}`
                            : "No price floor"}
                        </span>
                      </td>
                      <td>
                        <strong className="premium">
                          {money(s.premium, 4)} <small>USDC</small>
                        </strong>
                        <span className="sub">Fixed per 1 XLM lot</span>
                      </td>
                      <td>
                        <strong>{s.available.toLocaleString()}</strong>
                        <span className="sub">1 lot = 1 XLM</span>
                      </td>
                      <td>
                        <strong>
                          {money(s.is_call ? s.cap - s.strike : s.strike, 2)}{" "}
                          USDC
                        </strong>
                        <span className="sub">Fully reserved</span>
                      </td>
                      <td>
                        <button
                          className="trade-button"
                          onClick={() => open(s)}
                        >
                          Trade <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <Empty
                  icon={<Search />}
                  title={
                    loading
                      ? "Loading markets…"
                      : error
                        ? "Markets unavailable"
                        : "No matching markets"
                  }
                  text={
                    loading
                      ? "Reading market inventory."
                      : error
                        ? "Resolve the connection error and refresh."
                        : "Try another filter, or write the first option series."
                  }
                />
              )}
            </div>
            {!stellar.isPreview && nextPage > 0n && (
              <button
                className="button"
                disabled={busy || loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const data = await stellar.loadMarkets(nextPage);
                    setSeries((prev) => [
                      ...new Map(
                        [...prev, ...data.series].map((s) => [String(s.id), s]),
                      ).values(),
                    ]);
                    setNextPage(data.next);
                  } catch (e) {
                    setError(errorText(e));
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Load older markets
              </button>
            )}
            <div className="table-caption">
              <span>
                {filtered.length} markets ·{" "}
                {stellar.isPreview
                  ? "Illustrative prices and inventory"
                  : "On-chain fixed premiums"}
              </span>
              <span>All amounts in USDC · Network fees in XLM</span>
            </div>
          </>
        )}
        {view === "portfolio" && (
          <>
            <div className="summary-strip">
              <div>
                <span>Positions</span>
                <strong>{positions.length}</strong>
              </div>
              <div>
                <span>
                  {stellar.isPreview ? "Paper premiums" : "Premiums paid"}
                </span>
                <strong>
                  {money(positions.reduce((a, p) => a + p.premium_paid, 0n))}{" "}
                  <small>USDC</small>
                </strong>
              </div>
              <div>
                <span>Settlement</span>
                <strong>
                  European <small>at expiry</small>
                </strong>
              </div>
            </div>
            <section className="panel">
              <div className="section-title">
                <h2>Your positions</h2>
                {stellar.isPreview && positions.length > 0 && (
                  <button
                    className="text-button"
                    onClick={() => {
                      localStorage.removeItem(paperKey);
                      localStorage.removeItem("steption:sample-base");
                      setPositions([]);
                      void refresh();
                    }}
                  >
                    Reset preview
                  </button>
                )}
              </div>
              {!positions.length ? (
                <Empty
                  icon={<Wallet />}
                  title={
                    address || stellar.isPreview
                      ? "Your next position starts here"
                      : "Connect your wallet"
                  }
                  text={
                    stellar.isPreview
                      ? "Save a paper trade from any sample market to see it here."
                      : "Connect Freighter to load your on-chain positions."
                  }
                  action={
                    <Link className="button primary" href="/app">
                      Explore markets <ArrowRight size={16} />
                    </Link>
                  }
                />
              ) : (
                <div className="position-list">
                  {positions.map((p) => {
                    const s = series.find((s) => s.id === p.series_id);
                    return (
                      <div className="position-row" key={String(p.id)}>
                        <Coin pair />
                        <div>
                          <strong>XLM / USDC</strong>
                          <span className="sub">
                            {s ? (
                              <>
                                {s.is_call ? "Capped call" : "Put"} · $
                                {money(s.strike)} strike · {date(s.expiry)}
                              </>
                            ) : (
                              "Series unavailable"
                            )}
                          </span>
                        </div>
                        <div>
                          <strong>{p.quantity.toLocaleString()} lots</strong>
                          <span className="sub">
                            Paid {money(p.premium_paid)} USDC
                          </span>
                        </div>
                        <div>
                          {p.claimed ? (
                            <span className="tag call">
                              <Check size={13} />
                              Claimed
                            </span>
                          ) : s?.settled ? (
                            <button
                              className="button primary"
                              disabled={!actionAllowed}
                              onClick={() =>
                                transact(() =>
                                  stellar.claim(address, p.id, progress),
                                )
                              }
                            >
                              Claim {money(s.payout * p.quantity)} USDC
                            </button>
                          ) : (
                            <span className="tag neutral">
                              {stellar.isPreview
                                ? "Paper position"
                                : "Awaiting expiry"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
        {view === "liquidity" && (
          <div className="two-column">
            <section className="panel">
              <div className="section-title">
                <h2>Your written series</h2>
                <button
                  className="button primary"
                  onClick={() => setShowWrite(true)}
                >
                  <Layers3 size={16} />
                  Create a series
                </button>
              </div>
              {!mySeries.length ? (
                <Empty
                  icon={<Layers3 />}
                  title="Put your collateral to work"
                  text="Create a fully backed offer with a fixed premium. Buyers pay the premium directly to your wallet."
                  action={
                    <button
                      className="button"
                      onClick={() => setShowWrite(true)}
                    >
                      Configure an offer <ArrowRight size={15} />
                    </button>
                  }
                />
              ) : (
                mySeries.map((s) => (
                  <div className="writer-row" key={String(s.id)}>
                    <div>
                      <Tag series={s} />
                      <h3>
                        ${money(s.strike)} · {date(s.expiry)}
                      </h3>
                      <p>
                        {s.sold.toLocaleString()} sold ·{" "}
                        {s.available.toLocaleString()} available
                      </p>
                    </div>
                    {s.settled ? (
                      <button
                        className="button"
                        disabled={!actionAllowed || s.writer_claimed}
                        onClick={() =>
                          transact(() =>
                            stellar.claimWriter(address, s.id, progress),
                          )
                        }
                      >
                        {s.writer_claimed
                          ? "Collateral returned"
                          : "Claim remaining collateral"}
                      </button>
                    ) : (
                      <button
                        className="button"
                        disabled={!actionAllowed || s.available === 0n}
                        onClick={() =>
                          transact(() =>
                            stellar.cancelInventory(
                              address,
                              s.id,
                              s.available,
                              progress,
                            ),
                          )
                        }
                      >
                        Cancel unsold inventory
                      </button>
                    )}
                  </div>
                ))
              )}
            </section>
            <aside className="panel explanation">
              <ShieldCheck size={24} />
              <h2>Collateral before exposure.</h2>
              <p>
                Put writers reserve the strike price for every 1 XLM lot.
                Capped-call writers reserve the difference between the cap and
                strike.
              </p>
              <hr />
              <div className="row">
                <span>Premium</span>
                <strong>Set by you</strong>
              </div>
              <div className="row">
                <span>Unfilled inventory</span>
                <strong>Cancel anytime</strong>
              </div>
              <div className="row">
                <span>Sold collateral</span>
                <strong>Locked until settlement</strong>
              </div>
              <p className="fine">
                These are individual writer offers. There is no shared liquidity
                pool or advertised APY.
              </p>
            </aside>
          </div>
        )}
        {view === "settlement" && (
          <>
            <section className="settlement-note">
              <ShieldCheck size={23} />
              <div>
                <strong>One expiry. One settlement price.</strong>
                <p>
                  Settlement uses the median XLM/USDC price from three fixed
                  oracle observations before expiry. Anyone can finalize a
                  series once those observations are available.
                </p>
              </div>
            </section>
            <section className="panel">
              <div className="section-title">
                <h2>Series to settle</h2>
                <span className="muted">Oracle publication delay applies</span>
              </div>
              {!series.filter((s) => Number(s.expiry) <= now).length ? (
                <Empty
                  icon={<Check />}
                  title="Nothing to settle yet"
                  text="Expired series appear here. Claims always pay the recorded owner."
                />
              ) : (
                series
                  .filter((s) => Number(s.expiry) <= now)
                  .map((s) => (
                    <div className="writer-row" key={String(s.id)}>
                      <div>
                        <Tag series={s} />
                        <h3>
                          XLM · ${money(s.strike)} · {date(s.expiry)}
                        </h3>
                        <span className="sub">
                          {s.settled
                            ? `Settled at ${money(s.settlement_price, 7)} USDC per XLM`
                            : "Waiting for fixed expiry observations"}
                        </span>
                      </div>
                      <button
                        className="button primary"
                        disabled={
                          !actionAllowed ||
                          s.settled ||
                          now <
                            Number(s.expiry) +
                              Number(config?.resolution ?? 300n)
                        }
                        onClick={() =>
                          transact(() =>
                            stellar.settle(address, s.id, progress),
                          )
                        }
                      >
                        {s.settled ? "Settled" : "Settle series"}
                      </button>
                    </div>
                  ))
              )}
            </section>
          </>
        )}
        {view === "learn" && <Learn />}
      </main>
      <footer>
        <Link className="footer-brand" href="/">
          <Mark small />
          steption.
        </Link>
        <span>Options, on your terms.</span>
        <div>
          <span>
            {stellar.isPreview
              ? "Preview environment"
              : `Stellar Testnet${networkVersion ? ` · Protocol ${networkVersion}` : ""}`}
          </span>
          <a
            href="https://developers.stellar.org"
            target="_blank"
            rel="noreferrer"
          >
            Stellar docs <ArrowUpRight size={13} />
          </a>
          <a href="mailto:hello@decenzio.com">
            Contact <ArrowUpRight size={13} />
          </a>
        </div>
      </footer>

      <dialog
        ref={drawer}
        className="trade-dialog"
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setSelected(null);
        }}
        onClick={(e) => {
          if (e.target === drawer.current && !busy) setSelected(null);
        }}
      >
        {selected && (
          <div className="drawer-content">
            <div className="section-title">
              <span className="eyebrow">
                {review ? "REVIEW ORDER" : "OPTION DETAILS"}
              </span>
              <button
                className="icon-button"
                aria-label="Close trade"
                disabled={busy}
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="trade-title">
              <Coin pair />
              <div>
                <h2>XLM / USDC</h2>
                <Tag series={selected} />
              </div>
            </div>
            <div className="terms-grid">
              <div>
                <span>Strike price</span>
                <strong>{decimal(selected.strike)} USDC</strong>
              </div>
              <div>
                <span>
                  {selected.is_call ? "Upper price cap" : "Settlement"}
                </span>
                <strong>
                  {selected.is_call
                    ? `${decimal(selected.cap)} USDC`
                    : "European"}
                </strong>
              </div>
              <div>
                <span>Expiry (UTC)</span>
                <strong>
                  {date(selected.expiry)} · {time(selected.expiry)} UTC
                </strong>
              </div>
              <div>
                <span>Premium / lot</span>
                <strong>{decimal(selected.premium)} USDC</strong>
              </div>
            </div>
            <Payoff series={selected} quantity={qty || 1n} />
            <label className="field">
              Quantity{" "}
              <span className="input-shell">
                <input
                  inputMode="numeric"
                  aria-label="Number of lots"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setReview(false);
                  }}
                  disabled={busy}
                />
                <span>lots</span>
              </span>
              <small>
                1 lot = 1 XLM · {selected.available.toLocaleString()} available
              </small>
            </label>
            <div className="order-summary">
              <div className="row">
                <span>Premium / maximum loss</span>
                <strong>{decimal(selected.premium * qty)} USDC</strong>
              </div>
              <div className="row">
                <span>Maximum gross payout</span>
                <strong>
                  {decimal(
                    (selected.is_call
                      ? selected.cap - selected.strike
                      : selected.strike) * qty,
                  )}{" "}
                  USDC
                </strong>
              </div>
              <div className="row">
                <span>Network fee</span>
                <span>
                  {stellar.isPreview
                    ? "None — paper trade"
                    : "Calculated in Freighter"}
                </span>
              </div>
            </div>
            <p className="fine">
              {selected.is_call ? "Upside stops at the cap. " : ""}Trading
              closes {(3 * Number(config?.resolution ?? 300n)) / 60} minutes
              before expiry. Positions cannot be transferred or exercised early.
              The option may expire with zero payout.
            </p>
            {(error || notice) && (
              <p
                role={error ? "alert" : "status"}
                className={error ? "inline-error" : "inline-status"}
              >
                {error || notice}
                {hash && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {" "}
                    View transaction
                  </a>
                )}
              </p>
            )}
            <button
              className="button primary full"
              disabled={
                busy ||
                qty === 0n ||
                qty > selected.available ||
                !!config?.paused ||
                Number(selected.expiry) -
                  3 * Number(config?.resolution ?? 300n) <=
                  now
              }
              onClick={
                !stellar.isPreview && !address
                  ? connect
                  : review
                    ? purchase
                    : () => setReview(true)
              }
            >
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={17} />
                  Processing…
                </>
              ) : !stellar.isPreview && !address ? (
                "Connect Freighter"
              ) : review ? (
                stellar.isPreview ? (
                  "Save paper trade"
                ) : (
                  "Sign and buy on Testnet"
                )
              ) : (
                "Review order"
              )}
              {!busy && <ArrowRight size={16} />}
            </button>
            <p className="fine centered">
              {stellar.isPreview
                ? "Sample market · No wallet signature or funds required"
                : "USDC payment · Your wallet authorizes the transaction"}
            </p>
          </div>
        )}
      </dialog>
      <dialog
        ref={writerDialog}
        className="write-dialog"
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setShowWrite(false);
        }}
      >
        <WriteForm
          busy={busy}
          preview={stellar.isPreview}
          address={address}
          config={config}
          error={error}
          notice={notice}
          close={() => setShowWrite(false)}
          connect={connect}
          submit={(terms) =>
            transact(async () => {
              await stellar.createSeries(address, terms, progress);
              setShowWrite(false);
            })
          }
        />
      </dialog>
    </div>
  );
}

function Empty({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
type WriteTerms = {
  isCall: boolean;
  strike: bigint;
  cap: bigint;
  expiry: bigint;
  premium: bigint;
  capacity: bigint;
};
function WriteForm({
  busy,
  preview,
  address,
  config,
  error,
  notice,
  close,
  connect,
  submit,
}: {
  busy: boolean;
  preview: boolean;
  address: string;
  config: Config | null;
  error: string;
  notice: string;
  close: () => void;
  connect: () => void;
  submit: (t: WriteTerms) => void;
}) {
  const [kind, setKind] = useState("put"),
    [strike, setStrike] = useState("0.20"),
    [cap, setCap] = useState("0.30"),
    [premium, setPremium] = useState("0.01"),
    [capacity, setCapacity] = useState("1000"),
    [expiry, setExpiry] = useState(""),
    [localError, setLocalError] = useState("");
  let reserve = 0n;
  try {
    reserve =
      (kind === "call" ? atoms(cap) - atoms(strike) : atoms(strike)) *
      lots(capacity);
  } catch {}
  function build() {
    setLocalError("");
    try {
      const unix = Math.floor(Date.parse(`${expiry}:00Z`) / 1000);
      const resolution = Number(config?.resolution ?? 300n);
      if (
        !Number.isFinite(unix) ||
        unix < Math.floor(Date.now() / 1000) + 4 * resolution
      )
        throw new Error(
          "Choose an expiry at least four oracle intervals from now.",
        );
      if (unix % resolution !== 0)
        throw new Error(
          `Expiry must align to the oracle’s ${resolution}-second interval.`,
        );
      const terms = {
        isCall: kind === "call",
        strike: atoms(strike),
        cap: kind === "call" ? atoms(cap) : 0n,
        expiry: BigInt(unix),
        premium: atoms(premium),
        capacity: lots(capacity),
      };
      if (terms.strike <= 0n || terms.premium <= 0n || reserve <= 0n)
        throw new Error("Strike, premium and collateral must be positive.");
      if (
        terms.premium > (terms.isCall ? terms.cap - terms.strike : terms.strike)
      )
        throw new Error("Premium cannot exceed the maximum payout.");
      if (preview) {
        setLocalError(
          "This preview calculates collateral only. Deploy and configure the contract to create an on-chain offer.",
        );
        return;
      }
      submit(terms);
    } catch (e) {
      setLocalError(errorText(e));
    }
  }
  return (
    <div className="drawer-content">
      <div className="section-title">
        <h2>Create a series</h2>
        <button
          className="icon-button"
          aria-label="Close writer form"
          disabled={busy}
          onClick={close}
        >
          <X size={20} />
        </button>
      </div>
      <p>Fixed terms. Fully reserved in USDC.</p>
      <div className="segmented">
        <button
          className={kind === "put" ? "selected" : ""}
          onClick={() => setKind("put")}
        >
          Put
        </button>
        <button
          className={kind === "call" ? "selected" : ""}
          onClick={() => setKind("call")}
        >
          Capped call
        </button>
      </div>
      <div className="form-grid">
        <label className="field">
          Strike (USDC)
          <input
            inputMode="decimal"
            value={strike}
            onChange={(e) => setStrike(e.target.value)}
          />
        </label>
        {kind === "call" && (
          <label className="field">
            Upper cap (USDC)
            <input
              inputMode="decimal"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
            />
          </label>
        )}
        <label className="field">
          Premium per lot
          <input
            inputMode="decimal"
            value={premium}
            onChange={(e) => setPremium(e.target.value)}
          />
        </label>
        <label className="field">
          Inventory (whole lots)
          <input
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </label>
        <label className="field">
          Expiry (UTC)
          <input
            type="datetime-local"
            step="300"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </label>
      </div>
      <div className="collateral-total">
        <span>Collateral required</span>
        <strong>
          {reserve > 0n ? money(reserve) : "—"} <small>USDC</small>
        </strong>
      </div>
      <p className="fine">
        Creating an offer transfers this reserve to the contract. Sold lots stay
        locked until oracle settlement. You can cancel unsold lots.
      </p>
      {(localError || error || notice) && (
        <p
          role="status"
          className={localError || error ? "inline-error" : "inline-status"}
        >
          {localError || error || notice}
        </p>
      )}
      <button
        className="button primary full"
        disabled={busy || !!config?.paused}
        onClick={!preview && !address ? connect : build}
      >
        {busy
          ? "Confirm in Freighter…"
          : preview
            ? "Check collateral"
            : !address
              ? "Connect Freighter"
              : "Create and collateralize"}
      </button>
    </div>
  );
}

function Learn() {
  const [email, setEmail] = useState(""),
    [status, setStatus] = useState(""),
    [sending, setSending] = useState(false);
  return (
    <>
      <div className="learn-grid">
        {learnSteps.map(([n, t, d]) => (
          <article className="panel learn-card" key={n}>
            <span className="step-number">{n}</span>
            <h2>{t}</h2>
            <p>{d}</p>
          </article>
        ))}
      </div>
      <div className="two-column">
        <section className="panel faq">
          <h2>The details that matter</h2>
          {learnFaqs.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <ChevronDown size={16} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
        <aside className="panel newsletter">
          <BookOpen size={25} />
          <h2>Keep up with Steption.</h2>
          <p>Protocol updates, testnet milestones and new releases.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSending(true);
              try {
                const r = await fetch("/api/newsletter/subscribe", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                const data = await r.json();
                setStatus(data.message || data.error);
                if (r.ok) setEmail("");
              } catch {
                setStatus("Unable to subscribe. Please try again.");
              } finally {
                setSending(false);
              }
            }}
          >
            <label className="field">
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                maxLength={254}
              />
            </label>
            <button className="button primary full" disabled={sending}>
              {sending ? "Subscribing…" : "Subscribe"}
              <ArrowRight size={15} />
            </button>
            <p role="status" className="fine">
              {status}
            </p>
          </form>
          <a
            className="resource-link"
            href="https://developers.stellar.org/docs/build/smart-contracts/overview"
            target="_blank"
            rel="noreferrer"
          >
            Explore Soroban <ExternalLink size={15} />
          </a>
        </aside>
      </div>
    </>
  );
}
