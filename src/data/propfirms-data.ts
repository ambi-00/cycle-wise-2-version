// src/data/propfirms-data.ts
// Data structure for Prop Firm comparison table

export interface PropFirm {
  name: string;
  logo: string;
  rating: number;
  reviews: number;
  country: string;
  years: number;
  markets: string[];
  platforms: string[];
  maxFunding: number;
  discountCode?: string | null;
  affiliateLink: string;
  accountSize?: number;
  steps?: number;
  profitTarget?: number;
  dailyLoss?: number;
  maxLoss?: number;
  profitSplit?: number;
  payoutFreq?: string;
  price?: number;
}

// Example entries (just copy and adjust)
export const propFirms: PropFirm[] = [
  {
    name: "FTMO",
    logo: "https://ftmo.com/logo.png",
    rating: 4.8,
    reviews: 1200,
    country: "CZ",
    years: 8,
    markets: ["FX", "Indices", "Metals", "Crypto"],
    platforms: ["MT4", "MT5", "cTrader"],
    maxFunding: 400000,
    discountCode: null,
    affiliateLink: "https://ftmo.com/?aff=deinCode",
    accountSize: 100000,
    steps: 2,
    profitTarget: 10,
    dailyLoss: 5,
    maxLoss: 10,
    profitSplit: 80,
    payoutFreq: "14 days",
    price: 540,
  },
  {
    name: "MyFundedFX",
    logo: "https://myfundedfx.com/logo.png",
    rating: 4.5,
    reviews: 900,
    country: "US",
    years: 3,
    markets: ["FX", "Crypto", "Indices"],
    platforms: ["MT4", "MT5", "cTrader"],
    maxFunding: 300000,
    discountCode: "CYCLEWISE10",
    affiliateLink: "https://myfundedfx.com/?aff=deinCode",
    accountSize: 100000,
    steps: 2,
    profitTarget: 8,
    dailyLoss: 4,
    maxLoss: 8,
    profitSplit: 80,
    payoutFreq: "14 days",
    price: 499,
  },
  // --- Placeholder for additional Prop Firms ---
  ...Array.from({ length: 98 }).map((_, i) => ({
    name: `PropFirm ${i + 3}`,
    logo: "https://via.placeholder.com/40x40?text=Logo",
    rating: 0,
    reviews: 0,
    country: "",
    years: 0,
    markets: [],
    platforms: [],
    maxFunding: 0,
    discountCode: null,
    affiliateLink: "",
    accountSize: 0,
    steps: 0,
    profitTarget: 0,
    dailyLoss: 0,
    maxLoss: 0,
    profitSplit: 0,
    payoutFreq: "",
    price: 0,
  }))
];
