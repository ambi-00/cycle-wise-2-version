import { Button } from "@/components/ui/button";
import { Info, CopyPlus, Heart, X, Clipboard } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { propFirms } from "@/data/propfirms-data";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const countryFlags: Record<string, string> = {
  US: "🇺🇸",
  CZ: "🇨🇿",
  GB: "🇬🇧",
  AE: "🇦🇪",
  // ...
};

export default function PropFirmCompare() {
  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  function toggleBookmark(firmName: string) {
    setBookmarks((prev) =>
      prev.includes(firmName)
        ? prev.filter((n) => n !== firmName)
        : [...prev, firmName]
    );
  }
  // Vergleichsmodus state
  const [compare, setCompare] = useState<string[]>([]);
  function toggleCompare(firmName: string) {
    setCompare((prev) =>
      prev.includes(firmName)
        ? prev.filter((n) => n !== firmName)
        : [...prev, firmName]
    );
  }

  // Show bookmarks modal/dropdown state
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showCompareTable, setShowCompareTable] = useState(false);
  const navigate = useNavigate();
  const [market, setMarket] = useState<'forex' | 'futures'>('forex');
  const [tab, setTab] = useState<'challenges' | 'best' | 'reviews'>('challenges');
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState({
    accountSizes: [],
    stepsArr: [],
    profitTarget: '',
    dailyLoss: '',
    maxLoss: '',
    profitSplit: '',
  });

      const [showAccountDropdown, setShowAccountDropdown] = useState(false);
      const [showStepsDropdown, setShowStepsDropdown] = useState(false);
  // Suchfeld State
  const [search, setSearch] = useState("");
  // Filter nach Markt und Suchfeld
  const filteredFirms = propFirms.filter(firm => {
    const marketMatch = market === 'forex'
      ? firm.markets.some(m => m.toLowerCase().includes('fx') || m.toLowerCase().includes('forex'))
      : firm.markets.some(m => m.toLowerCase().includes('future'));
    const searchMatch = firm.name.toLowerCase().includes(search.toLowerCase());
    return marketMatch && searchMatch;
  });

  return (
    <>
      <TooltipProvider>
      <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
        <div className="mx-auto max-w-7xl p-4 lg:p-8">
          <h1 className="text-3xl font-bold mb-1">Prop Firm Comparison</h1>
          <p className="text-muted-foreground text-base mb-8 mt-0">
            Find the prop firm that matches you best – and get the best discount for it.
          </p>
          {/* Markt-Tabs */}
          <div className="flex gap-2 mb-6 justify-center">
            {['forex', 'futures'].map((m) => (
              <button
                key={m}
                className={`px-5 py-2 rounded-full font-semibold text-sm shadow-sm border border-transparent transition-colors duration-150
                  ${market === m ? 'bg-primary text-white' : 'bg-muted/40 text-primary hover:bg-primary/10'}
                `}
                onClick={() => setMarket(m as 'forex' | 'futures')}
              >
                {m === 'forex' ? 'Forex' : 'Futures'}
              </button>
            ))}
          </div>
          {/* Ansicht-Tabs (styled like Statistics) */}
          <div className="mb-8 flex flex-col gap-4 justify-center items-center">
            <div className="w-full max-w-md">
              <div className="flex justify-center">
                <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
                  {[
                    { key: 'challenges', label: 'Challenges' },
                    { key: 'best', label: 'Best Sellers' },
                    { key: 'reviews', label: 'Reviews' }
                  ].map(tabObj => (
                    <button
                      key={tabObj.key}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${tab === tabObj.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                      style={{ flex: 1, minWidth: 0 }}
                      onClick={() => setTab(tabObj.key as typeof tab)}
                    >
                      {tabObj.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Remove standalone search field here */}
          </div>
          {/* Filter row: left-aligned above table */}
          <div className="flex gap-4 mb-2 items-center">
            {/* Filter Popover Trigger */}
            <Button type="button" variant="default" size="sm" onClick={() => setShowFilter(true)}>
              Filter
            </Button>
            {/* Account Size Dropdown */}
            <div className="flex flex-col min-w-[160px]">
              <span className="font-semibold text-sm mb-1">Account Size</span>
              <Select
                value={filter.accountSizes[0] || ""}
                onValueChange={val => {
                  if (val === "other") return; // handled below
                  setFilter(f => ({
                    ...f,
                    accountSizes: val ? [val] : []
                  }));
                }}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-primary border-border data-[state=open]:ring-primary data-[state=open]:border-primary">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25000">25k Account</SelectItem>
                  <SelectItem value="50000">50k Account</SelectItem>
                  <SelectItem value="100000">100k Account</SelectItem>
                  <SelectItem value="200000">200k Account</SelectItem>
                  <SelectItem value="400000">400k Account</SelectItem>
                  <SelectItem value="500000">500k Account</SelectItem>
                  <SelectItem value="1000000">1M Account</SelectItem>
                  <SelectItem value="other">Other...</SelectItem>
                </SelectContent>
              </Select>
              {filter.accountSizes[0] === "other" && (
                <input
                  type="text"
                  className="mt-2 border-border focus:ring-primary focus:border-primary rounded px-2 py-1 text-sm"
                  placeholder="Enter custom size (e.g. 75000)"
                  value={filter.accountSizes[1] || ""}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setFilter(f => ({
                      ...f,
                      accountSizes: ["other", val]
                    }));
                  }}
                />
              )}
            </div>
            {/* Steps Dropdown and Search Field */}
            <div className="flex flex-col min-w-[120px]">
              <span className="font-semibold text-sm mb-1">Steps</span>
              <Select
                value={filter.stepsArr[0]?.toString() || ""}
                onValueChange={val =>
                  setFilter(f => ({
                    ...f,
                    stepsArr: val ? [parseInt(val)] : []
                  }))
                }
              >
                <SelectTrigger className="focus:ring-2 focus:ring-primary border-border data-[state=open]:ring-primary data-[state=open]:border-primary">
                  <SelectValue placeholder="Select steps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Step</SelectItem>
                  <SelectItem value="2">2 Steps</SelectItem>
                  <SelectItem value="3">3 Steps</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Search Field next to Steps Dropdown and Heart Icon */}
            <div className="flex items-end min-w-[220px] gap-2">
              <div className="flex flex-col flex-1">
                <span className="font-semibold text-sm mb-1">Search</span>
                <Input
                  type="text"
                  placeholder="Search Prop Firms..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              {/* Heart Icon Button to show bookmarks */}
              <button
                type="button"
                className={`ml-2 mb-1 p-2 rounded-full border border-transparent transition-colors ${showBookmarks ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-primary/5 hover:text-primary'}`}
                aria-label="Show saved prop firms"
                onClick={() => setShowBookmarks(v => !v)}
              >
                <Heart className={`w-6 h-6 ${bookmarks.length > 0 ? 'fill-primary' : 'fill-none'}`} />
              </button>
            </div>
                  {/* Bookmarked Prop Firms Modal/Dropdown */}
                  {showBookmarks && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                      <div className="bg-white rounded-xl shadow-lg p-6 min-w-[320px] max-w-full relative">
                        <button
                          className="absolute top-2 right-2 p-1 rounded hover:bg-muted"
                          onClick={() => setShowBookmarks(false)}
                          aria-label="Close"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Heart className="w-5 h-5 text-primary" /> Saved Prop Firms
                        </h2>
                        {bookmarks.length === 0 ? (
                          <div className="text-muted-foreground text-sm">No prop firms saved yet.</div>
                        ) : (
                          <ul className="divide-y divide-muted-foreground/10">
                            {bookmarks.map(name => (
                              <li key={name} className="py-2 flex items-center justify-between">
                                <span>{name}</span>
                                <button
                                  className="text-xs text-primary hover:underline"
                                  onClick={() => toggleBookmark(name)}
                                >Remove</button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
            {/* Aktive Filter anzeigen */}
            <div className="flex flex-wrap gap-2 items-center">
              {filter.accountSizes.map(size => (
                <span key={size} className="bg-primary/10 text-primary px-3 py-1 rounded text-xs font-semibold">
                  {(() => {
                    const sizeNum = parseInt(size, 10);
                    return `Account Size: ${sizeNum >= 1000 ? (sizeNum / 1000) + 'k' : sizeNum}`;
                  })()}
                  <button className="ml-2 text-primary font-bold" onClick={() => setFilter(f => ({ ...f, accountSizes: f.accountSizes.filter(s => s !== size) }))}>×</button>
                </span>
              ))}
              {filter.stepsArr.map(step => (
                <span key={step} className="bg-primary/10 text-primary px-3 py-1 rounded text-xs font-semibold">
                  Steps: {step}
                  <button className="ml-2 text-primary font-bold" onClick={() => setFilter(f => ({ ...f, stepsArr: f.stepsArr.filter(s => s !== step) }))}>×</button>
                </span>
              ))}
            </div>
          </div>
        {/* End filter row */}
        <div className="overflow-x-auto rounded-2xl bg-card shadow-card p-0 w-full">
            {tab === 'challenges' && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-4 text-left align-top">
                      <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-start justify-between gap-1">
                        Prop Firm
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="ml-1 p-0.5 rounded hover:bg-muted focus:bg-muted" tabIndex={0} type="button">
                              <Info className="inline w-4 h-4 align-top" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-sm font-normal">Name and logo of the prop firm.</TooltipContent>
                        </Tooltip>
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left align-top">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-start justify-between gap-1">
                        Account size
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="ml-1 p-0.5 rounded hover:bg-muted focus:bg-muted" tabIndex={0} type="button">
                              <Info className="inline w-4 h-4 align-top" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-sm font-normal">Initial capital for the challenge.</TooltipContent>
                        </Tooltip>
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left align-top">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-start justify-between gap-1">
                        Steps
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="ml-1 p-0.5 rounded hover:bg-muted focus:bg-muted" tabIndex={0} type="button">
                              <Info className="inline w-4 h-4 align-top" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-sm font-normal">Number of phases you must pass.</TooltipContent>
                        </Tooltip>
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left align-top">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-start justify-between gap-1">
                        Profit target
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="ml-1 p-0.5 rounded hover:bg-muted focus:bg-muted" tabIndex={0} type="button">
                              <Info className="inline w-4 h-4 align-top" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-sm font-normal">Profit goal you need to reach (in %).</TooltipContent>
                        </Tooltip>
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left align-top">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-start justify-between gap-1">
                        Daily loss
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="ml-1 p-0.5 rounded hover:bg-muted focus:bg-muted" tabIndex={0} type="button">
                              <Info className="inline w-4 h-4 align-top" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-sm font-normal">Maximum loss per day (in %).</TooltipContent>
                        </Tooltip>
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left align-top">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-start justify-between gap-1">
                        Max loss
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="ml-1 p-0.5 rounded hover:bg-muted focus:bg-muted" tabIndex={0} type="button">
                              <Info className="inline w-4 h-4 align-top" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-sm font-normal">Maximum total loss allowed (in %).</TooltipContent>
                        </Tooltip>
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left align-top">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-start justify-between gap-1">
                        Profit split
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="ml-1 p-0.5 rounded hover:bg-muted focus:bg-muted" tabIndex={0} type="button">
                              <Info className="inline w-4 h-4 align-top" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-sm font-normal">Percentage of profit you keep.</TooltipContent>
                        </Tooltip>
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left align-top">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-start justify-between gap-1">
                        Payout freq.
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="ml-1 p-0.5 rounded hover:bg-muted focus:bg-muted" tabIndex={0} type="button">
                              <Info className="inline w-4 h-4 align-top" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-sm font-normal">How often you can request payouts.</TooltipContent>
                        </Tooltip>
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left align-top">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-start justify-between gap-1">
                        Price
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="ml-1 p-0.5 rounded hover:bg-muted focus:bg-muted" tabIndex={0} type="button">
                              <Info className="inline w-4 h-4 align-top" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-sm font-normal">Fee to join the challenge.</TooltipContent>
                        </Tooltip>
                      </span>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"></th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFirms.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">No prop firms found for this market.</td>
                    </tr>
                  ) : (
                    filteredFirms.map((firm) => (
                      <tr key={firm.name} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-4 flex items-center gap-3 min-w-[180px]">
                          <img src={firm.logo} alt={firm.name} className="h-8 w-8 rounded bg-white object-contain border" />
                          <span className="text-base font-medium text-foreground">{firm.name}</span>
                        </td>
                        <td className="px-4 py-4 text-base font-medium text-foreground">{firm.accountSize ? `$${firm.accountSize >= 1000 ? (firm.accountSize/1000)+ 'k' : firm.accountSize}` : '—'}</td>
                        <td className="px-4 py-4 text-base font-medium text-foreground">{firm.steps || '—'}</td>
                        <td className="px-4 py-4 text-base font-medium text-foreground">{firm.profitTarget ? `${firm.profitTarget}%` : '—'}</td>
                        <td className="px-4 py-4 text-base font-medium text-foreground">{firm.dailyLoss ? `${firm.dailyLoss}%` : '—'}</td>
                        <td className="px-4 py-4 text-base font-medium text-foreground">{firm.maxLoss ? `${firm.maxLoss}%` : '—'}</td>
                        <td className="px-4 py-4 text-base font-medium text-foreground">{firm.profitSplit ? `${firm.profitSplit}%` : '—'}</td>
                        <td className="px-4 py-4 text-base font-medium text-foreground">{firm.payoutFreq || '—'}</td>
                        <td className="px-4 py-4 text-base font-medium text-foreground">{firm.price ? `$${firm.price}` : '—'}</td>
                        <td className="px-4 py-4 flex gap-2 items-center justify-end">
                          {/* Compare Button */}
                          <button
                            aria-label={compare.includes(firm.name) ? "Remove from compare" : "Add to compare"}
                            onClick={() => toggleCompare(firm.name)}
                            className={
                              compare.includes(firm.name)
                                ? "text-primary"
                                : "text-muted-foreground hover:text-primary"
                            }
                          >
                            <CopyPlus fill={compare.includes(firm.name) ? "#ec4899" : "none"} className="w-5 h-5" />
                          </button>
                          {/* Bookmark Button (Heart) */}
                          <button
                            aria-label={bookmarks.includes(firm.name) ? "Remove bookmark" : "Add bookmark"}
                            onClick={() => toggleBookmark(firm.name)}
                            className={
                              bookmarks.includes(firm.name)
                                ? "text-primary"
                                : "text-muted-foreground hover:text-primary"
                            }
                          >
                            <Heart fill={bookmarks.includes(firm.name) ? "currentColor" : "none"} className="w-5 h-5 transition-colors text-primary" />
                          </button>
                          {firm.discountCode && (
                            <span className="bg-primary/10 text-primary font-semibold rounded px-2 py-1 text-xs flex items-center gap-1 mr-2 border border-primary/20">
                              Code: {firm.discountCode}
                              <button
                                className="ml-1 text-primary hover:text-primary/80"
                                onClick={() => {
                                  navigator.clipboard.writeText(firm.discountCode!);
                                }}
                                title="Copy code"
                              >
                                <Clipboard className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          )}
                          <a href={firm.affiliateLink} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="secondary">Buy</Button>
                          </a>
                        </td>
                            {/* Vergleichsmodus Bar */}
                            {compare.length > 0 && (
                              <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg flex items-center gap-4 px-6 py-3">
                                <span className="font-semibold text-sm">Vergleich:</span>
                                {compare.map(name => (
                                  <span key={name} className="flex items-center gap-1 bg-muted rounded px-3 py-1 text-xs font-medium">
                                    {name}
                                    <button onClick={() => toggleCompare(name)} aria-label="Remove from compare" className="ml-1 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                                  </span>
                                ))}
                                <Button size="sm" variant="default" className="ml-4" onClick={() => setShowCompareTable(true)}>
                                  Vergleich anzeigen
                                </Button>
                              </div>
                            )}

                            {/* Vergleichs-Tabelle Modal */}
                            {showCompareTable && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCompareTable(false)}>
                                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full relative" onClick={e => e.stopPropagation()}>
                                  <button className="absolute top-2 right-2 text-xl" onClick={() => setShowCompareTable(false)}>&times;</button>
                                  <h2 className="text-lg font-bold mb-4">Prop Firm Vergleich</h2>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm border">
                                      <thead>
                                        <tr className="border-b border-border bg-muted/30">
                                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Firm</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Size</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Steps</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profit Target</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Loss</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max Loss</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profit Split</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payout Freq.</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {compare.map(name => {
                                          const firm = propFirms.find(f => f.name === name);
                                          if (!firm) return null;
                                          return (
                                            <tr key={firm.name} className="border-b border-border/50">
                                              <td className="px-4 py-2 font-semibold flex items-center gap-2 min-w-[180px]">
                                                <img src={firm.logo} alt={firm.name} className="h-7 w-7 rounded bg-white object-contain border" />
                                                {firm.name}
                                              </td>
                                              <td className="px-4 py-2">{firm.accountSize ? `$${firm.accountSize >= 1000 ? (firm.accountSize/1000)+ 'k' : firm.accountSize}` : '—'}</td>
                                              <td className="px-4 py-2">{firm.steps || '—'}</td>
                                              <td className="px-4 py-2">{firm.profitTarget ? `${firm.profitTarget}%` : '—'}</td>
                                              <td className="px-4 py-2">{firm.dailyLoss ? `${firm.dailyLoss}%` : '—'}</td>
                                              <td className="px-4 py-2">{firm.maxLoss ? `${firm.maxLoss}%` : '—'}</td>
                                              <td className="px-4 py-2">{firm.profitSplit ? `${firm.profitSplit}%` : '—'}</td>
                                              <td className="px-4 py-2">{firm.payoutFreq || '—'}</td>
                                              <td className="px-4 py-2 font-semibold">{firm.price ? `$${firm.price}` : '—'}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
            {/* Additional tabs like Best Sellers, Reviews can be added here */}
          </div>
          {/* Filter Popover/Drawer */}
          {showFilter && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowFilter(false)}>
              <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xs relative" onClick={e => e.stopPropagation()}>
                <button className="absolute top-2 right-2 text-xl" onClick={() => setShowFilter(false)}>&times;</button>
                <h2 className="text-lg font-bold mb-4">Filter</h2>
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="account-size">
                    <AccordionTrigger>Account Size</AccordionTrigger>
                    <AccordionContent>
                      {["25000", "50000", "100000", "200000", "400000", "500000", "1000000"].map(size => {
                        const sizeNum = parseInt(size, 10);
                        return (
                          <label key={size} className="flex items-center gap-2 py-1 cursor-pointer">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-pink-400 accent-pink-500"
                              checked={filter.accountSizes.includes(size)}
                              onChange={e => {
                                setFilter(f => {
                                  const arr = f.accountSizes;
                                  return {
                                    ...f,
                                    accountSizes: e.target.checked
                                      ? [...arr, size]
                                      : arr.filter(s => s !== size)
                                  };
                                });
                              }}
                            />
                            <span className="text-sm">{sizeNum >= 1000000 ? `${sizeNum/1000000}M` : sizeNum >= 1000 ? `${sizeNum/1000}k` : sizeNum} Account</span>
                          </label>
                        );
                      })}
                      {/* Other option */}
                      <label className="flex items-center gap-2 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-pink-400 accent-pink-500"
                          checked={filter.accountSizes[0] === "other"}
                          onChange={e => {
                            if (e.target.checked) {
                              setFilter(f => ({ ...f, accountSizes: ["other", f.accountSizes[1] || ""] }));
                            } else {
                              setFilter(f => ({ ...f, accountSizes: f.accountSizes.filter(s => s !== "other") }));
                            }
                          }}
                        />
                        <span className="text-sm">Other...</span>
                      </label>
                      {filter.accountSizes[0] === "other" && (
                        <input
                          type="text"
                          className="mt-2 border-pink-300 focus:ring-pink-400 focus:border-pink-400 rounded px-2 py-1 text-sm"
                          placeholder="Enter custom size (e.g. 75000)"
                          value={filter.accountSizes[1] || ""}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            setFilter(f => ({
                              ...f,
                              accountSizes: ["other", val]
                            }));
                          }}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="steps">
                    <AccordionTrigger>Steps</AccordionTrigger>
                    <AccordionContent>
                      {[1, 2, 3].map(step => (
                        <label key={step} className="flex items-center gap-2 py-1 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 accent-primary"
                            checked={filter.stepsArr.includes(step)}
                            onChange={e => {
                              setFilter(f => {
                                const arr = f.stepsArr;
                                return {
                                  ...f,
                                  stepsArr: e.target.checked
                                    ? [...arr, step]
                                    : arr.filter(s => s !== step)
                                };
                              });
                            }}
                          />
                          <span className="text-sm">{step} Step</span>
                        </label>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="profit-target">
                    <AccordionTrigger>Profit Target (%)</AccordionTrigger>
                    <AccordionContent>
                      {["6", "8", "10", "12"].map(target => (
                        <label key={target} className="flex items-center gap-2 py-1 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 accent-primary"
                            checked={filter.profitTarget === target}
                            onChange={e => setFilter(f => ({ ...f, profitTarget: e.target.checked ? target : '' }))}
                          />
                          <span className="text-sm">{target}%</span>
                        </label>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="daily-loss">
                    <AccordionTrigger>Daily Loss (%)</AccordionTrigger>
                    <AccordionContent>
                      {["3", "5", "6"].map(loss => (
                        <label key={loss} className="flex items-center gap-2 py-1 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 accent-primary"
                            checked={filter.dailyLoss === loss}
                            onChange={e => setFilter(f => ({ ...f, dailyLoss: e.target.checked ? loss : '' }))}
                          />
                          <span className="text-sm">{loss}%</span>
                        </label>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="max-loss">
                    <AccordionTrigger>Max Loss (%)</AccordionTrigger>
                    <AccordionContent>
                      {["6", "10", "12"].map(max => (
                        <label key={max} className="flex items-center gap-2 py-1 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 accent-primary"
                            checked={filter.maxLoss === max}
                            onChange={e => setFilter(f => ({ ...f, maxLoss: e.target.checked ? max : '' }))}
                          />
                          <span className="text-sm">{max}%</span>
                        </label>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="profit-split">
                    <AccordionTrigger>Profit Split (%)</AccordionTrigger>
                    <AccordionContent>
                      {["70", "80", "90", "100"].map(split => (
                        <label key={split} className="flex items-center gap-2 py-1 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 accent-primary"
                            checked={filter.profitSplit === split}
                            onChange={e => setFilter(f => ({ ...f, profitSplit: e.target.checked ? split : '' }))}
                          />
                          <span className="text-sm">{split}%</span>
                        </label>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                  {/* Example: Fees Filter */}
                  <AccordionItem value="fees">
                    <AccordionTrigger>Fees</AccordionTrigger>
                    <AccordionContent>
                      {["Low", "Medium", "High"].map(fee => (
                        <label key={fee} className="flex items-center gap-2 py-1 cursor-pointer">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-primary" disabled />
                          <span className="text-sm">{fee}</span>
                        </label>
                      ))}
                      <div className="text-xs text-muted-foreground mt-2">(Demo: Logik noch nicht aktiv)</div>
                    </AccordionContent>
                  </AccordionItem>
                  {/* Example: Payout Speed Filter */}
                  <AccordionItem value="payout-speed">
                    <AccordionTrigger>Payout Speed</AccordionTrigger>
                    <AccordionContent>
                      {["Fast", "Average", "Slow"].map(speed => (
                        <label key={speed} className="flex items-center gap-2 py-1 cursor-pointer">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-primary" disabled />
                          <span className="text-sm">{speed}</span>
                        </label>
                      ))}
                      <div className="text-xs text-muted-foreground mt-2">(Demo: Logik noch nicht aktiv)</div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setFilter({ accountSizes: [], stepsArr: [], profitTarget: '', dailyLoss: '', maxLoss: '', profitSplit: '' })}>Reset All</Button>
              </div>
            </div>
          )}
            {/* Compare mode bar */}
            {compare.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg flex items-center gap-4 px-6 py-3">
                <span className="font-semibold text-sm">Compare:</span>
                {compare.map(name => (
                  <span key={name} className="flex items-center gap-1 bg-muted rounded px-3 py-1 text-xs font-medium">
                    {name}
                    <button onClick={() => toggleCompare(name)} aria-label="Remove from compare" className="ml-1 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                  </span>
                ))}
                <Button size="sm" variant="default" className="ml-4" onClick={() => setShowCompareTable(true)}>
                  Show comparison
                </Button>
              </div>
            )}

            {/* Comparison Table Modal */}
            {showCompareTable && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCompareTable(false)}>
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full relative" onClick={e => e.stopPropagation()}>
                  <button className="absolute top-2 right-2 text-xl" onClick={() => setShowCompareTable(false)}>&times;</button>
                  <h2 className="text-lg font-bold mb-4">Prop Firm Comparison</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Firm</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Size</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Steps</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profit Target</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Loss</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max Loss</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profit Split</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payout Freq.</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compare.map(name => {
                          const firm = propFirms.find(f => f.name === name);
                          if (!firm) return null;
                          return (
                            <tr key={firm.name} className="border-b border-border/50">
                              <td className="px-4 py-2 font-semibold flex items-center gap-2 min-w-[180px]">
                                <img src={firm.logo} alt={firm.name} className="h-7 w-7 rounded bg-white object-contain border" />
                                {firm.name}
                              </td>
                              <td className="px-4 py-2">{firm.accountSize ? `$${firm.accountSize >= 1000 ? (firm.accountSize/1000)+ 'k' : firm.accountSize}` : '—'}</td>
                              <td className="px-4 py-2">{firm.steps || '—'}</td>
                              <td className="px-4 py-2">{firm.profitTarget ? `${firm.profitTarget}%` : '—'}</td>
                              <td className="px-4 py-2">{firm.dailyLoss ? `${firm.dailyLoss}%` : '—'}</td>
                              <td className="px-4 py-2">{firm.maxLoss ? `${firm.maxLoss}%` : '—'}</td>
                              <td className="px-4 py-2">{firm.profitSplit ? `${firm.profitSplit}%` : '—'}</td>
                              <td className="px-4 py-2">{firm.payoutFreq || '—'}</td>
                              <td className="px-4 py-2 font-semibold">{firm.price ? `$${firm.price}` : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
        </div> {/* Close max-w-7xl container */}
      </main>
    </TooltipProvider>
  </> 
  );
}
