"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  Check,
  ArrowRight,
  Zap,
  Shield,
  CreditCard,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { createPublicClient, http, encodeFunctionData, parseUnits, formatUnits } from "viem";
import { arcTestnet } from "viem/chains";

// Arc Testnet USDC contract (6 decimals, ERC-20)
const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;
// Platform treasury address for receiving subscription payments
// In production this should be an env var — for testnet we use a fixed address
const TREASURY_ADDRESS =
  (process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000001"; // placeholder — set NEXT_PUBLIC_TREASURY_ADDRESS in .env.local

// Minimal ERC-20 ABI for balanceOf + transfer
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// Lazy-init the viem public client only on the client side to avoid SSR crashes
function getArcClient() {
  return createPublicClient({
    chain: arcTestnet,
    transport: http("https://rpc.testnet.arc.network"),
  });
}

export default function PricingPage() {
  const router = useRouter();
  const { getAccessToken, authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [privyBalance, setPrivyBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    tier: string;
    amount: number;
    txHash?: string;
    step: "confirm" | "signing" | "verifying" | "done" | "error";
    errorDetail?: string;
  } | null>(null);

  // Embedded Privy wallet on Arc Testnet
  const privyWallet = wallets.find(
    (w) => w.walletClientType === "privy" && w.chainId === `eip155:${arcTestnet.id}`
  ) || wallets.find((w) => w.walletClientType === "privy");

  // Load current subscription tier
  useEffect(() => {
    async function loadSubscription() {
      if (!authenticated) return;
      try {
        const token = await getAccessToken();
        const res = await fetch(`${BACKEND}/subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.tier) setCurrentTier(data.tier.toLowerCase());
        }
      } catch (err) {
        console.warn("Could not fetch subscription tier:", err);
      }
    }
    loadSubscription();
  }, [authenticated, getAccessToken]);

  // Fetch Privy wallet USDC balance on Arc Testnet
  const fetchPrivyBalance = useCallback(async () => {
    if (!privyWallet) return;
    setBalanceLoading(true);
    try {
      const address = privyWallet.address as `0x${string}`;
      // Lazy-init client here (client-side only) to avoid SSR issues
      const client = getArcClient();
      const raw = await client.readContract({
        address: ARC_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      });
      const formatted = parseFloat(formatUnits(raw as bigint, 6));
      setPrivyBalance(formatted);
    } catch (err) {
      console.warn("Could not fetch Privy USDC balance:", err);
      setPrivyBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [privyWallet]);

  useEffect(() => {
    if (authenticated && privyWallet) {
      fetchPrivyBalance();
    }
  }, [authenticated, privyWallet, fetchPrivyBalance]);

  // Open modal with balance pre-fetched
  const handleUpgrade = async (tier: string) => {
    if (!authenticated) {
      login();
      return;
    }
    const costMap: Record<string, number> = { pro: 20, power: 99 };
    const amount = costMap[tier] || 0;

    // Refresh balance before showing modal
    await fetchPrivyBalance();

    setErrorMsg(null);
    setPaymentModal({ open: true, tier, amount, step: "confirm" });
  };

  // Execute real USDC payment via Privy embedded wallet
  const confirmAndPay = async () => {
    if (!paymentModal || !privyWallet) return;
    const { tier, amount } = paymentModal;

    // Guard: check balance
    if (privyBalance !== null && privyBalance < amount) {
      setPaymentModal((m) =>
        m
          ? {
              ...m,
              step: "error",
              errorDetail: `Insufficient USDC! You have ${privyBalance.toFixed(2)} USDC but need ${amount}.00 USDC. Top up at faucet.circle.com.`,
            }
          : null
      );
      return;
    }

    setPaymentModal((m) => (m ? { ...m, step: "signing" } : null));

    try {
      // Switch to Arc Testnet if supported
      try {
        await privyWallet.switchChain(arcTestnet.id);
      } catch {
        // switchChain may not be available on all wallet types — ignore and proceed
      }

      // Get the wallet provider
      const provider = await privyWallet.getEthereumProvider();

      // Encode ERC-20 transfer call data
      const calldata = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [TREASURY_ADDRESS, parseUnits(amount.toString(), 6)],
      });

      // Send transaction through Privy — user sees native approval UX
      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: privyWallet.address,
            to: ARC_USDC_ADDRESS,
            data: calldata,
          },
        ],
      });

      setPaymentModal((m) => (m ? { ...m, step: "verifying", txHash: txHash as string } : null));

      // Tell backend to verify tx and upgrade tier
      const token = await getAccessToken();
      const res = await fetch(`${BACKEND}/subscription/upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier, txHash, from: privyWallet.address }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPaymentModal((m) => (m ? { ...m, step: "done" } : null));
        setSuccess(true);
        setCurrentTier(tier);
        // Refresh balance
        await fetchPrivyBalance();
        setTimeout(() => {
          setPaymentModal(null);
          router.push("/settings");
        }, 2500);
      } else {
        setPaymentModal((m) =>
          m
            ? {
                ...m,
                step: "error",
                errorDetail: data.message || "Payment verification failed. Contact support.",
              }
            : null
        );
      }
    } catch (err: any) {
      console.error("Payment failed:", err);
      const msg =
        err?.message?.includes("rejected") || err?.code === 4001
          ? "Transaction rejected by user."
          : err?.message || "Failed to send USDC payment.";
      setPaymentModal((m) => (m ? { ...m, step: "error", errorDetail: msg } : null));
    }
  };

  const hasSufficientBalance = privyBalance !== null && paymentModal
    ? privyBalance >= paymentModal.amount
    : true; // optimistic if balance not yet loaded

  const tierBadge = (tier: string) => {
    const map: Record<string, string> = { free: "Free", pro: "Pro", power: "Power" };
    return map[tier] || tier;
  };

  return (
    <div className="flex flex-col items-center py-12 px-4 max-w-5xl mx-auto min-h-[calc(100vh-6rem)]">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Automate DeFi with <span className="text-neon-blue">BlockGENT</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
          Scale your autonomous trading strategies. Pay only for what you use, or unlock unlimited
          potential with our premium plans.
        </p>
        {authenticated && privyWallet && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#22252F] bg-[#15161C] text-xs">
            <span className="text-slate-500">Your Privy Wallet:</span>
            {balanceLoading ? (
              <Loader2 className="w-3 h-3 text-neon-blue animate-spin" />
            ) : privyBalance !== null ? (
              <span className="text-neon-blue font-bold font-mono">{privyBalance.toFixed(2)} USDC</span>
            ) : (
              <span className="text-slate-500">—</span>
            )}
            <span className="text-slate-600 font-mono text-[10px]">
              {privyWallet.address.slice(0, 6)}…{privyWallet.address.slice(-4)}
            </span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mb-8 p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-400 font-bold flex items-center justify-center w-full max-w-2xl">
          ⚠️ {errorMsg}
        </div>
      )}

      {success && (
        <div className="mb-8 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 font-bold flex items-center justify-center w-full max-w-2xl">
          ✅ Upgrade successful! Redirecting to your settings...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Free Tier */}
        <div className="flex flex-col p-6 rounded-2xl border border-[#22252F] bg-[#090A0F] glass-panel relative animate-spring-pop">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-2">Free</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">$0</span>
              <span className="text-slate-500 text-sm">/ forever</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-6 flex-1">
            Perfect for exploring autonomous agents and testing strategies on Arc Testnet.
          </p>
          <ul className="flex flex-col gap-3 mb-8">
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              1 AI Agent
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              Up to 3 active automation rules
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              50 LLM actions / month
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-500">
              <Check className="w-4 h-4 text-slate-700 shrink-0" />
              No Nanopayment (x402) access
            </li>
          </ul>
          <button
            disabled
            className="w-full py-3 rounded-xl border border-[#22252F] text-slate-500 font-bold text-xs bg-[#15161C] cursor-not-allowed"
          >
            {currentTier === "free" ? "Current Plan" : "Basic Tier"}
          </button>
        </div>

        {/* Pro Tier */}
        <div className="flex flex-col p-6 rounded-2xl border border-neon-blue bg-[#090A0F]/80 shadow-[0_0_30px_rgba(0,255,255,0.1)] relative md:scale-105 z-10 animate-spring-pop">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neon-blue text-slate-950 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            Most Popular
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-neon-blue mb-2">Pro</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">$20</span>
              <span className="text-slate-500 text-sm">/ month</span>
            </div>
            <span className="text-[10px] text-neon-blue/60 mt-1 block">Paid natively in USDC on Arc</span>
          </div>
          <p className="text-xs text-slate-400 mb-6 flex-1">
            For active traders needing sophisticated multi-agent setups and live data.
          </p>
          <ul className="flex flex-col gap-3 mb-8">
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-neon-blue shrink-0" />
              Up to 3 AI Agents
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-neon-blue shrink-0" />
              Unlimited automation rules
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-neon-blue shrink-0" />
              500 LLM actions / month
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-neon-blue shrink-0" />
              $5.00 monthly Nanopayments budget
            </li>
          </ul>

          {currentTier === "pro" ? (
            <button
              disabled
              className="w-full py-3 rounded-xl border border-neon-blue/40 text-neon-blue font-bold text-xs bg-neon-blue/10 cursor-not-allowed"
            >
              ✓ Current Plan
            </button>
          ) : currentTier === "power" ? (
            <button
              disabled
              className="w-full py-3 rounded-xl border border-[#22252F] text-slate-600 bg-[#15161C] cursor-not-allowed font-bold text-xs"
            >
              Included in Power
            </button>
          ) : (
            <button
              onClick={() => handleUpgrade("pro")}
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all bg-neon-blue text-slate-950 hover:bg-white"
            >
              Upgrade to Pro — 20 USDC
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Power Tier */}
        <div className="flex flex-col p-6 rounded-2xl border border-[#22252F] bg-[#090A0F] relative animate-spring-pop">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-2">Power</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">$99</span>
              <span className="text-slate-500 text-sm">/ month</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Paid natively in USDC on Arc</span>
          </div>
          <p className="text-xs text-slate-400 mb-6 flex-1">
            Unlimited automation potential for serious DeFi power users.
          </p>
          <ul className="flex flex-col gap-3 mb-8">
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              Up to 10 AI Agents
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              Unlimited automation rules
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              Unlimited LLM actions
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              $25.00 monthly Nanopayments budget
            </li>
          </ul>

          {currentTier === "power" ? (
            <button
              disabled
              className="w-full py-3 rounded-xl border border-emerald-500/40 text-emerald-400 font-bold text-xs bg-emerald-950/20 cursor-not-allowed"
            >
              ✓ Current Plan
            </button>
          ) : (
            <button
              onClick={() => handleUpgrade("power")}
              disabled={loading}
              className="w-full py-3 rounded-xl border border-[#22252F] text-white hover:border-white transition-colors font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {currentTier === "pro" ? "Upgrade to Power — 99 USDC" : "Upgrade to Power — 99 USDC"}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Current Plan Banner */}
      {currentTier !== "free" && (
        <div className="mt-8 w-full max-w-2xl p-4 rounded-2xl border border-neon-blue/20 bg-neon-blue/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-neon-blue" />
            <div>
              <p className="text-xs text-slate-400">Current Subscription</p>
              <p className="text-sm font-bold text-white uppercase tracking-wider">{tierBadge(currentTier)} Plan</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/settings")}
            className="text-xs text-neon-blue hover:text-white transition-colors font-semibold flex items-center gap-1"
          >
            Manage <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* PAYMENT CONFIRMATION MODAL */}
      {paymentModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#090A0F]/80 backdrop-blur-md"
            onClick={() => {
              if (paymentModal.step === "confirm" || paymentModal.step === "error") {
                setPaymentModal(null);
              }
            }}
          />

          <div className="relative glass-panel border-neon-blue/30 bg-[#15161C] max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 animate-slide-in z-50 rounded-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#22252F] pb-3.5">
              <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue shrink-0">
                {paymentModal.step === "signing" || paymentModal.step === "verifying" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : paymentModal.step === "done" ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : paymentModal.step === "error" ? (
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-extrabold text-white tracking-tight">
                  {paymentModal.step === "confirm" && "Approve USDC Subscription"}
                  {paymentModal.step === "signing" && "Waiting for Signature..."}
                  {paymentModal.step === "verifying" && "Verifying Payment..."}
                  {paymentModal.step === "done" && "Payment Confirmed!"}
                  {paymentModal.step === "error" && "Payment Failed"}
                </h3>
                <span className="text-[10px] text-neon-blue font-mono">
                  {paymentModal.step === "confirm" && "Privy Wallet · Arc Testnet"}
                  {paymentModal.step === "signing" && "Check your Privy wallet popup"}
                  {paymentModal.step === "verifying" && "Checking transaction on Arc..."}
                  {paymentModal.step === "done" && `Upgraded to ${paymentModal.tier.toUpperCase()}`}
                  {paymentModal.step === "error" && "Transaction was not completed"}
                </span>
              </div>
            </div>

            {/* Payment Details */}
            {(paymentModal.step === "confirm" || paymentModal.step === "signing") && (
              <div className="flex flex-col gap-3 bg-[#090A0F] p-4 rounded-xl border border-[#22252F]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Plan:</span>
                  <span className="text-white font-bold uppercase tracking-wider">
                    {paymentModal.tier} Plan
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Monthly Cost:</span>
                  <span className="text-neon-blue font-bold font-mono">
                    {paymentModal.amount}.00 USDC
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-[#22252F] pt-2.5">
                  <span className="text-slate-400 font-semibold">Gas Fee:</span>
                  <span className="text-emerald-400 font-bold font-mono">~0.00 USDC (Arc native)</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-[#22252F] pt-2.5">
                  <span className="text-slate-400 font-semibold">Your Balance:</span>
                  {balanceLoading ? (
                    <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />
                  ) : privyBalance !== null ? (
                    <span
                      className={`font-bold font-mono ${
                        hasSufficientBalance ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {privyBalance.toFixed(2)} USDC
                      {!hasSufficientBalance && " ⚠ Insufficient"}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono text-xs">Unable to load</span>
                  )}
                </div>
              </div>
            )}

            {/* Insufficient Funds Warning */}
            {paymentModal.step === "confirm" && !hasSufficientBalance && privyBalance !== null && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                <span>
                  You need <strong>{paymentModal.amount}.00 USDC</strong> but your Privy wallet
                  only has <strong>{privyBalance.toFixed(2)} USDC</strong>. Get testnet USDC at{" "}
                  <a
                    href="https://faucet.circle.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-rose-200"
                  >
                    faucet.circle.com
                  </a>
                  .
                </span>
              </div>
            )}

            {/* Consent notice */}
            {paymentModal.step === "confirm" && hasSufficientBalance && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 leading-relaxed">
                By clicking <strong>Approve &amp; Pay</strong>, you authorize your Privy Wallet to
                send <strong>{paymentModal.amount}.00 USDC</strong> on Arc Testnet as a monthly
                subscription payment.
              </div>
            )}

            {/* Signing spinner */}
            {paymentModal.step === "signing" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
                <p className="text-xs text-slate-400 text-center">
                  A Privy approval popup should appear. Please sign the transaction to continue.
                </p>
              </div>
            )}

            {/* Verifying */}
            {paymentModal.step === "verifying" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
                <p className="text-xs text-slate-400 text-center">
                  Transaction submitted. Confirming on Arc Testnet...
                </p>
                {paymentModal.txHash && (
                  <a
                    href={`https://testnet.arcscan.app/tx/${paymentModal.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-neon-blue hover:underline flex items-center gap-1"
                  >
                    View on ArcScan <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Success */}
            {paymentModal.step === "done" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-bold text-white">Subscription Activated!</p>
                <p className="text-xs text-slate-400 text-center">
                  Welcome to the{" "}
                  <span className="text-neon-blue font-bold uppercase">{paymentModal.tier}</span>{" "}
                  plan. Redirecting...
                </p>
              </div>
            )}

            {/* Error */}
            {paymentModal.step === "error" && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{paymentModal.errorDetail || "An unexpected error occurred."}</span>
              </div>
            )}

            {/* Actions */}
            {(paymentModal.step === "confirm" || paymentModal.step === "error") && (
              <div className="flex items-center gap-3 justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setPaymentModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#22252F] hover:bg-[#22252F] text-xs text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  {paymentModal.step === "error" ? "Close" : "Cancel"}
                </button>
                {paymentModal.step === "confirm" && (
                  <button
                    type="button"
                    onClick={confirmAndPay}
                    disabled={!hasSufficientBalance && privyBalance !== null}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all shadow-lg flex items-center gap-1.5 ${
                      !hasSufficientBalance && privyBalance !== null
                        ? "bg-[#22252F] text-slate-500 cursor-not-allowed"
                        : "bg-neon-blue text-slate-950 hover:bg-white"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Approve &amp; Pay {paymentModal.amount} USDC
                  </button>
                )}
                {paymentModal.step === "error" && (
                  <button
                    type="button"
                    onClick={() => setPaymentModal((m) => (m ? { ...m, step: "confirm", errorDetail: undefined } : null))}
                    className="px-5 py-2.5 rounded-xl bg-neon-blue text-slate-950 font-bold text-xs cursor-pointer hover:bg-white transition-all shadow-lg"
                  >
                    Try Again
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
