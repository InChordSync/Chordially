import StellarSdk from "stellar-sdk";

export const horizonServer = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org"
);

export const validatePublicKey = (key: string): boolean => {
  try {
    StellarSdk.Keypair.fromPublicKey(key);
    return true;
  } catch {
    return false;
  }
};

export const formatXLM = (stroops: string): string => {
  const STROOPS_PER_XLM = 10_000_000n;
  const value = BigInt(stroops);
  const sign = value < 0n ? "-" : "";
  const absValue = value < 0n ? -value : value;
  const whole = absValue / STROOPS_PER_XLM;
  const fraction = absValue % STROOPS_PER_XLM;

  return `${sign}${whole.toString()}.${fraction
    .toString()
    .padStart(7, "0")}`;
};
