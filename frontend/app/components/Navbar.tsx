"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useApp } from "../context/AppContext";
import { Search, Bell, LogOut, ChevronDown, Check, User } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const { logout } = usePrivy();
  const {
    connectedWallet,
    connectWallet,
    disconnectWallet,
    searchWallet,
    explorerWallet,
  } = useApp();

  const [searchVal, setSearchVal] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      searchWallet(searchVal.trim());
      router.push("/dashboard");
    }
  };


  const [tickerPrices, setTickerPrices] = useState([
    {
      symbol: "BTC",
      feedId: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
      price: "$0.00",
      change: "0.00%",
      isPositive: true,
      sparkline: "M0,15 L10,8 L20,12 L30,4 L40,9 L50,2 L60,5",
    },
    {
      symbol: "ETH",
      feedId: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
      price: "$0.00",
      change: "0.00%",
      isPositive: true,
      sparkline: "M0,12 L10,14 L20,8 L30,10 L40,5 L50,3 L60,4",
    },
    {
      symbol: "EURC",
      feedId: "0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b",
      price: "$0.00",
      change: "0.00%",
      isPositive: true,
      sparkline: "M0,12 L10,14 L20,8 L30,10 L40,5 L50,3 L60,4",
    },
    {
      symbol: "USDC",
      feedId: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
      price: "$0.00",
      change: "0.00%",
      isPositive: true,
      sparkline: "M0,10 L10,10 L20,10 L30,10 L40,10 L50,10 L60,10",
    },
  ]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = tickerPrices.map(t => t.feedId).join("&ids[]=");
        const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${ids}`;
        const response = await fetch(url);
        if (!response.ok) return;
        const data = await response.json();
        
        if (data.parsed) {
          setTickerPrices((prev) =>
            prev.map((item) => {
              const matched = data.parsed.find(
                (p: any) => p.id.toLowerCase() === item.feedId.toLowerCase().replace("0x", "")
              );
              if (matched && matched.price && matched.ema_price) {
                const rawPrice = BigInt(matched.price.price);
                const expo = Number(matched.price.expo);
                const priceNum = Number(rawPrice) * Math.pow(10, expo);

                const rawEma = BigInt(matched.ema_price.price);
                const emaExpo = Number(matched.ema_price.expo);
                const emaPriceNum = Number(rawEma) * Math.pow(10, emaExpo);

                const changeNum = emaPriceNum > 0 ? ((priceNum - emaPriceNum) / emaPriceNum) * 100 : 0;
                
                // Format price text nicely
                const formattedPrice = priceNum >= 1000
                  ? `$${priceNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `$${priceNum.toFixed(4)}`;

                // Format change relative to EMA
                const prefix = changeNum > 0 ? "+" : "";
                const formattedChange = `${prefix}${changeNum.toFixed(2)}%`;
                  
                return {
                  ...item,
                  price: formattedPrice,
                  change: formattedChange,
                  isPositive: changeNum >= 0,
                };
              }
              return item;
            })
          );
        }
      } catch (err) {
        console.error("Failed to fetch client-side ticker prices from Pyth:", err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-18 border-b border-[#22252F] bg-[#090A0F]/85 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none z-30">
      
      {/* Token Ticker - Hidden on smaller screens */}
      <div className="hidden lg:flex items-center overflow-hidden max-w-[55%] ticker-wrap select-none">
        <div className="flex items-center gap-8 text-xs font-medium ticker-content">
          {[...tickerPrices, ...tickerPrices].map((token, index) => (
            <div key={`${token.symbol}-${index}`} className="inline-flex items-center gap-2 shrink-0 mr-12 select-none">
              <span className="text-slate-400 font-bold">{token.symbol}</span>
              <span className="text-slate-100 font-mono">{token.price}</span>
              <span className={`font-mono text-[10px] ${token.isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                {token.change}
              </span>
              {/* Sparkline Chart */}
              <svg className="w-10 h-4 shrink-0 overflow-visible ml-1" viewBox="0 0 60 20">
                <path
                  d={token.sparkline}
                  fill="none"
                  stroke={token.isPositive ? "#34d399" : "#fb7185"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex-1 lg:flex-none flex items-center gap-4 justify-end">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-sm w-full md:w-64">
          <input
            type="text"
            placeholder="Search wallet (0x...)"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full h-9.5 pl-9.5 pr-4 rounded-xl bg-[#08070F] border border-[#22252F] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/20 transition-all font-mono"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </form>

        {/* Notifications Icon */}
        <button className="w-9.5 h-9.5 rounded-xl border border-[#22252F] bg-[#15161C] hover:bg-[#22252F] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors relative cursor-pointer">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neon-cyan animate-pulse-glow" />
        </button>

        {/* Wallet Connector */}
        {connectedWallet ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="h-9.5 px-3.5 rounded-xl border border-[#22252F] bg-[#15161C] flex items-center gap-2.5 text-xs text-white hover:bg-[#22252F] transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-slate-200">
                {connectedWallet.address.slice(0, 6)}...{connectedWallet.address.slice(-4)}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#22252F] bg-[#15161C] backdrop-blur-md p-1.5 shadow-2xl z-50 animate-slide-in">
                  <div className="px-3 py-2 border-b border-[#22252F] text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {connectedWallet.type} Wallet
                  </div>
                  <div className="flex flex-col mt-1">
                    <div className="px-3 py-2 text-xs text-slate-300 font-mono flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400">Balance</span>
                      <span className="font-bold text-white text-sm">{connectedWallet.balanceUSDC.toLocaleString()} USDC</span>
                    </div>
                    <button
                      onClick={async () => {
                        await logout();
                        disconnectWallet();
                        setDropdownOpen(false);
                        router.push("/onboarding");
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 rounded-lg transition-colors cursor-pointer text-left w-full mt-1.5"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      Logout Workspace
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* Profile Avatar */}
        <button
          onClick={() => router.push("/settings")}
          className="w-9.5 h-9.5 rounded-xl border border-[#22252F] bg-[#090A0F] overflow-hidden flex items-center justify-center text-slate-400 hover:border-neon-blue/50 hover:bg-[#15161C] transition-all cursor-pointer"
          title="User Settings"
        >
          {connectedWallet ? (
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
              alt="User Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
}
