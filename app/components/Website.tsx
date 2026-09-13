"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { homeFaqs, team, homeSteps } from "../lib/content";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ShieldCheck,
  Layers3,
  Clock3,
  Menu,
  X,
} from "lucide-react";

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Steption home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>
        steption<span className="brand-period">.</span>
      </span>
    </Link>
  );
}

export default function Website() {
  const [menu, setMenu] = useState(false),
    [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [sending, setSending] = useState(false);
  return (
    <div className="website">
      <a className="skip-link" href="#website-main">
        Skip to content
      </a>
      <header className="website-header">
        <Brand />
        <nav
          className={menu ? "website-nav expanded" : "website-nav"}
          aria-label="Website navigation"
        >
          {[
            ["about", "Protocol"],
            ["how-it-works", "How it works"],
            ["team", "Team"],
            ["faq", "FAQ"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
              {label}
            </a>
          ))}
        </nav>
        <Link className="button primary" href="/app">
          Open app <ArrowUpRight size={16} />
        </Link>
        <button
          className="icon-button website-menu"
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main id="website-main">
        <section className="website-hero">
          <div className="hero-copy">
            <span className="website-kicker">
              <span />
              OPTIONS ON STELLAR
            </span>
            <h1>
              The market moves.
              <br />
              Make your
              <br />
              <em>next move.</em>
            </h1>
            <p>
              Protect your downside. Take a view on upside.
              <br />
              Explore a new way to trade XLM with options
              <br className="desktop-break" /> backed by collateral, from the
              start.
            </p>
            <div className="hero-actions">
              <Link href="/app" className="button primary">
                Explore the app <ArrowUpRight size={19} />
              </Link>
              <a href="#how-it-works" className="hero-secondary">
                See how it works <ArrowRight size={17} />
              </a>
            </div>
            <span className="hero-status">
              Testnet development release · Preview available now
            </span>
          </div>
          <div className="hero-diagram">
            <div className="diagram-top">
              <span className="diagram-token">X</span>
              <div>
                <strong>XLM / USDC</strong>
                <span>Put option · European settlement</span>
              </div>
              <ShieldCheck size={22} />
            </div>
            <div className="diagram-heading">
              <span>AN EXAMPLE POSITION</span>
              <h2>
                Room to move.
                <br />A defined downside.
              </h2>
            </div>
            <div className="diagram-chart">
              <div className="chart-labels">
                <span>Net option payoff</span>
                <span>USDC / lot</span>
              </div>
              <svg
                viewBox="0 0 430 230"
                role="img"
                aria-label="Illustrative put payoff. A 0.20 USDC strike with 0.01 USDC premium. At an XLM price of 0.10 USDC the net payoff is 0.09 USDC; at or above the strike, the loss is the 0.01 premium."
              >
                <path
                  d="M28 40H405M28 115H405M28 190H405"
                  stroke="#33372a"
                  strokeDasharray="3 5"
                />
                <path
                  d="M28 40L216 206H405"
                  stroke="#fded58"
                  strokeWidth="3"
                  fill="none"
                />
                <circle cx="216" cy="206" r="5" fill="#fded58" />
                <text x="28" y="228">
                  0.10
                </text>
                <text x="201" y="228">
                  0.20
                </text>
                <text x="380" y="228">
                  0.30
                </text>
                <text x="302" y="180">
                  −0.01 maximum loss
                </text>
              </svg>
              <div className="chart-labels">
                <span>Underlying XLM price in USDC</span>
                <span>Illustrative</span>
              </div>
            </div>
            <div className="diagram-terms">
              <div>
                <span>Strike</span>
                <strong>
                  0.20 <small>USDC</small>
                </strong>
              </div>
              <div>
                <span>Premium / max loss</span>
                <strong>
                  0.01 <small>USDC</small>
                </strong>
              </div>
              <div>
                <span>Contract size</span>
                <strong>
                  1 <small>XLM</small>
                </strong>
              </div>
            </div>
            <p>Example excludes network fees. Not a live market quote.</p>
          </div>
        </section>
        <div className="website-principles">
          <span>BUILT ON STELLAR</span>
          <strong>Fully collateralized</strong>
          <i />
          <strong>Fixed premiums</strong>
          <i />
          <strong>European settlement</strong>
          <i />
          <strong>USDC denominated</strong>
        </div>
        <section id="about" className="website-section">
          <div className="website-section-heading">
            <div>
              <span className="eyebrow">THE PROTOCOL</span>
              <h2>
                More ways to position.
                <br />
                Clear terms from day one.
              </h2>
            </div>
            <p>
              Steption brings financial options to Stellar. Start with one pair,
              choose your direction, and see the terms before you commit.
            </p>
          </div>
          <div className="website-feature-grid">
            {[
              [
                ShieldCheck,
                "Protect with puts",
                "A put pays when XLM falls below the strike. Your option loss is limited to the premium you pay, plus network fees.",
                "Explore puts",
              ],
              [
                ArrowUpRight,
                "Take a view with calls",
                "A capped call gives you exposure above the strike, up to a stated price cap. See your maximum payout before buying.",
                "Explore capped calls",
              ],
              [
                Layers3,
                "Write on your terms",
                "Set the premium and reserve the collateral. Sell to buyers at your price and recover unfilled inventory when you choose.",
                "Start writing",
              ],
            ].map(([Icon, heading, copy, cta], i) => {
              const FeatureIcon = Icon as typeof ShieldCheck;
              return (
                <article key={String(heading)}>
                  <FeatureIcon size={27} />
                  <span className="feature-number">0{i + 1}</span>
                  <h3>{String(heading)}</h3>
                  <p>{String(copy)}</p>
                  <Link href={i === 2 ? "/liquidity" : "/app"}>
                    {String(cta)}
                    <ArrowUpRight size={17} />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
        <section id="how-it-works" className="website-section process-section">
          <div className="website-section-heading">
            <div>
              <span className="eyebrow">FROM POSITION TO PAYOUT</span>
              <h2>
                A complete view.
                <br />
                At every step.
              </h2>
            </div>
            <Link className="button" href="/learn">
              Read the mechanics <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="website-steps">
            {homeSteps.map(([n, t, d]) => (
              <div key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
          <div className="website-settlement">
            <Clock3 size={22} />
            <p>
              <strong>Terms stay fixed.</strong> Buying closes before the
              settlement observation window. The price uses three fixed
              historical XLM/USDC observations, so a late settlement call does
              not choose a new market price.
            </p>
          </div>
        </section>
        <section id="team" className="website-section">
          <div className="website-section-heading">
            <div>
              <span className="eyebrow">THE PEOPLE BEHIND STEPTION</span>
              <h2>
                Built by Decenzio.
                <br />
                Started at HackPera.
              </h2>
            </div>
            <p>
              Steption began at the HackPera Istanbul hackathon. We bring
              together experience in Web3, product interfaces and Stellar smart
              contracts.
            </p>
          </div>
          <div className="website-team">
            {team.map(([name, role, photo, url]) => (
              <article key={name}>
                <div className="team-photo">
                  <Image
                    src={photo}
                    alt={`${name}, ${role} at Steption`}
                    fill
                    sizes="(max-width: 700px) 100vw, 33vw"
                  />
                </div>
                <a href={url} target="_blank" rel="noreferrer">
                  <div>
                    <h3>{name}</h3>
                    <p>{role}</p>
                  </div>
                  <ArrowUpRight size={22} />
                </a>
              </article>
            ))}
          </div>
          <a
            className="website-inline-link"
            href="https://decenzio.com"
            target="_blank"
            rel="noreferrer"
          >
            Meet Decenzio <ArrowUpRight size={16} />
          </a>
        </section>
        <section id="faq" className="website-section website-faq">
          <div>
            <span className="eyebrow">A LITTLE MORE CLARITY</span>
            <h2>
              Good questions.
              <br />
              Straight answers.
            </h2>
            <a href="mailto:hello@decenzio.com">
              Talk to the team <ArrowUpRight size={17} />
            </a>
          </div>
          <div>
            {homeFaqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <ChevronDown size={17} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section id="community" className="website-newsletter">
          <div>
            <span className="eyebrow">STAY IN THE LOOP</span>
            <h2>
              The next chapter
              <br />
              starts on Stellar.
            </h2>
            <p>Get Steption updates and testnet milestones.</p>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSending(true);
              setMessage("");
              try {
                const response = await fetch("/api/newsletter/subscribe", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                const data = await response.json();
                setMessage(data.message || data.error);
                if (response.ok) setEmail("");
              } catch {
                setMessage("Unable to subscribe. Please try again.");
              } finally {
                setSending(false);
              }
            }}
          >
            <label htmlFor="website-email">Email address</label>
            <div>
              <input
                id="website-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={254}
              />
              <button type="submit" disabled={sending}>
                {sending ? "Joining…" : "Keep me updated"}
                <ArrowRight size={17} />
              </button>
            </div>
            <p role="status">
              {message || "Protocol news. Product updates. No market promises."}
            </p>
          </form>
        </section>
      </main>
      <footer className="website-footer">
        <div>
          <Brand />
          <p>Options, on your terms.</p>
        </div>
        <div>
          <a href="https://x.com/DecenzioHQ" target="_blank" rel="noreferrer">
            X <ArrowUpRight size={14} />
          </a>
          <a
            href="https://github.com/decenzio"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <ArrowUpRight size={14} />
          </a>
          <a
            href="https://www.linkedin.com/company/decenzio/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn <ArrowUpRight size={14} />
          </a>
          <a href="mailto:hello@decenzio.com">
            Contact <ArrowUpRight size={14} />
          </a>
          <Link href="/docs/api">
            API & agent docs <ArrowUpRight size={14} />
          </Link>
        </div>
        <span>Testnet development release · No mainnet deployment</span>
      </footer>
    </div>
  );
}
