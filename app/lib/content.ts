// Shared visible content for HTML, structured data and Markdown.
export const homeFaqs = [
  [
    "What is Steption?",
    "Steption is an options protocol built on Stellar. The current development release supports XLM/USDC puts and capped calls, backed by collateral deposited before buyers enter a position.",
  ],
  [
    "What can I do in the app?",
    "Explore option markets, inspect the payoff, buy an option, write a fully collateralized offer, and track positions through settlement. Preview mode lets you save paper trades without using funds.",
  ],
  [
    "How do writers earn premiums?",
    "Writers choose a fixed premium and reserve the maximum possible payout. When a buyer purchases their option, the premium goes directly to the writer. The writer’s final result depends on the option’s settlement payout; premiums are not guaranteed profit.",
  ],
  [
    "Why are calls capped?",
    "A capped call pays when XLM rises above its strike, up to an explicit upper price cap. That cap makes its maximum USDC payout finite, so writers can reserve the full amount before a trade.",
  ],
  [
    "When can I settle my option?",
    "These are European options. Settlement becomes available after expiry and the oracle publication delay. It uses fixed historical observations rather than the price when someone eventually submits settlement. Positions cannot be transferred or exercised early.",
  ],
  [
    "Is this available on Mainnet?",
    "This is a Testnet development release. The contracts have automated tests but have not received a professional audit. Preview data is illustrative; live Testnet trading requires a configured deployment.",
  ],
];
export const team = [
  ["Romi", "Web3 Specialist", "/team/romi.jpg", "https://x.com/romispectrum"],
  [
    "Murphy",
    "Frontend Developer",
    "/team/murphy.jpeg",
    "https://twitter.com/murphy__ts",
  ],
  [
    "Filip",
    "Smart Contract Developer",
    "/team/filip.jpeg",
    "https://x.com/Ph1l1pH_",
  ],
];
export const homeSteps = [
  [
    "01",
    "Find your market",
    "Compare puts and capped calls by strike, expiry, premium and available inventory.",
  ],
  [
    "02",
    "Review your position",
    "Inspect the payoff, quantity, exact price terms and maximum loss. Your wallet authorizes the trade.",
  ],
  [
    "03",
    "Track and settle",
    "Follow your positions in Portfolio. After expiry, finalize settlement and claim any payout.",
  ],
];
export const learnSteps = [
  [
    "01",
    "Choose your direction",
    "A put pays when XLM falls below your strike. A capped call pays when XLM rises above your strike, up to a stated cap.",
  ],
  [
    "02",
    "Know your maximum loss",
    "Buyers pay a fixed premium. That premium is the maximum option loss, plus any network fees. Writers reserve the maximum gross payout upfront.",
  ],
  [
    "03",
    "Settle at expiry",
    "European options settle after expiry. Three fixed historical XLM/USDC oracle prices determine the median. A late settlement call does not change the observation times.",
  ],
];
export const learnFaqs = [
  [
    "Can I close or transfer my option?",
    "This testnet version uses nontransferable positions. There is no secondary market or early exercise. Writers may cancel only unsold inventory.",
  ],
  [
    "What if the oracle is unavailable?",
    "Settlement waits for the exact historical observations. The contract never substitutes a later price. If the oracle permanently loses the required history, claims may remain locked; this requires resolution before a production release.",
  ],
  [
    "Are the sample numbers live?",
    "Preview mode contains illustrative inventory and premiums. Paper trades are stored only in this browser. Testnet mode reads the configured contract and reports RPC failures without switching to sample data.",
  ],
  [
    "How are dollars and USDC related?",
    "Strikes and collateral are denominated in USDC. Settlement divides XLM/USD by USDC/USD from the same fixed oracle timestamps, so the contract does not assume that USDC always equals one dollar.",
  ],
  [
    "Is this ready for real funds?",
    "This is a testnet development release. Its custom options contracts require independent review and an audit before any mainnet deployment.",
  ],
];
