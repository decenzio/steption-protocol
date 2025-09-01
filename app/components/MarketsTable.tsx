"use client";

import { useState } from "react";
import Image from "next/image";

interface MarketData {
  id: string;
  asset: string;
  imageUrl: string;
  price: string;
  change24h: number;
  volume24h: string;
  tvl: string;
  steptionsTvl: string;
  depositReturns: number;
}

const mockMarketData: MarketData[] = [
  {
    id: "1",
    asset: "BTC",
    imageUrl:
      "https://assets.coingecko.com/coins/images/1/standard/bitcoin.png",
    price: "$95,847.32",
    change24h: 2.4,
    volume24h: "$28.3B",
    tvl: "$845.2M",
    steptionsTvl: "$12.4M",
    depositReturns: 8.15,
  },
  {
    id: "2",
    asset: "ETH",
    imageUrl:
      "https://assets.coingecko.com/coins/images/279/standard/ethereum.png",
    price: "$3,421.67",
    change24h: 1.8,
    volume24h: "$15.7B",
    tvl: "$624.8M",
    steptionsTvl: "$8.9M",
    depositReturns: 6.42,
  },
  {
    id: "3",
    asset: "CHF",
    imageUrl:
      "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimg.favpng.com%2F11%2F21%2F11%2Fflag-of-switzerland-logo-coat-of-arms-of-switzerland-png-favpng-qcMfTRzvAeVeEYR2PbTtmB82p.jpg&f=1&nofb=1&ipt=a05c2d501ab85ae3f2ab355ba5e4c7eedec509f385646a71f58e3766c18cab7f",
    price: "$2.89",
    change24h: -3.2,
    volume24h: "$1.2M",
    tvl: "$45.6M",
    steptionsTvl: "$890K",
    depositReturns: 12.75,
  },
  {
    id: "4",
    asset: "XML",
    imageUrl:
      "https://assets.coingecko.com/coins/images/100/standard/fmpFRHHQ_400x400.jpg",
    price: "$0.847",
    change24h: 5.6,
    volume24h: "$3.8M",
    tvl: "$78.3M",
    steptionsTvl: "$2.1M",
    depositReturns: 9.33,
  },
];

export default function MarketsTable() {
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getAssetIcon = (asset: string, imageUrl: string) => {
    return (
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center shadow-sm overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${asset} icon`}
            width={32}
            height={32}
            className="rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.className = `w-10 h-10 rounded-full bg-gradient-to-br ${getFallbackColor(
                  asset
                )} border-2 border-gray-300 flex items-center justify-center text-white text-sm font-bold shadow-sm`;
                parent.textContent = asset;
              }
            }}
          />
        </div>
      </div>
    );
  };

  const getFallbackColor = (asset: string) => {
    const colors = {
      BTC: "from-orange-500 to-orange-600",
      ETH: "from-blue-500 to-blue-600",
      CHEF: "from-green-500 to-green-600",
      XML: "from-purple-500 to-purple-600",
    };
    return colors[asset as keyof typeof colors] || "from-gray-500 to-gray-600";
  };

  const formatChange = (change: number) => {
    const isPositive = change > 0;
    return (
      <span
        className={`font-semibold text-sm ${
          isPositive ? "text-green-700" : "text-red-600"
        }`}
      >
        {isPositive ? "+" : ""}
        {change.toFixed(1)}%
      </span>
    );
  };

  const formatReturns = (returns: number) => {
    return (
      <span className="text-green-700 font-semibold text-sm">
        {returns.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm">
      {/* HeaderApp */}
      <div className="bg-gray-100 px-6 py-4 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Markets</h3>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-orange-500"></div>
              <span className="text-sm font-semibold text-blue-700">
                STEPTION PROTOCOL STATS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Asset
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => handleSort("price")}
              >
                Price ↓
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => handleSort("change24h")}
              >
                24H % ↓
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => handleSort("volume24h")}
              >
                24H Volume ↓
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => handleSort("tvl")}
              >
                TVL ↓
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => handleSort("steptionsTvl")}
              >
                Protocol TVL ↓
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockMarketData.map((market) => (
              <tr
                key={market.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    {getAssetIcon(market.asset, market.imageUrl)}
                    <div>
                      <div className="text-base font-bold text-gray-900">
                        {market.asset}
                      </div>
                      <div className="text-sm font-medium text-gray-600">
                        Cryptocurrency
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                  {market.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatChange(market.change24h)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-gray-900">
                  {market.volume24h}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-gray-900">
                  {market.tvl}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                  {market.steptionsTvl}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
