// Prints commands only. Never submits a transaction or reads a secret key.
const [oracle, expiryInput, priceInput = "1800000", usdcInput = "10000000"] =
  process.argv.slice(2);
if (
  !/^C[A-Z2-7]{55}$/.test(oracle || "") ||
  !/^\d+$/.test(expiryInput || "") ||
  !/^\d+$/.test(priceInput) ||
  !/^\d+$/.test(usdcInput)
)
  throw new Error(
    "Usage: node scripts/fixture-observations.mjs MOCK_ORACLE_ID EXPIRY_UNIX [XLM_USD_ATOMS] [USDC_USD_ATOMS]",
  );
const expiry = BigInt(expiryInput);
if (
  expiry % 300n !== 0n ||
  expiry < 900n ||
  BigInt(priceInput) <= 0n ||
  BigInt(usdcInput) <= 0n
)
  throw new Error(
    "Expiry must align to 300 seconds and prices must be positive.",
  );
console.log(
  "# TEST FIXTURE ONLY. Wait until expiry before manually running these commands.",
);
for (let i = 1n; i <= 3n; i++)
  for (const [asset, value] of [
    ["XLM", priceInput],
    ["USDC", usdcInput],
  ])
    console.log(
      `stellar contract invoke --id ${oracle} --source-account steption-deployer --network testnet -- set_price --asset '{"Other":"${asset}"}' --timestamp ${expiry - i * 300n} --value ${value}`,
    );
