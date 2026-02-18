import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Trophy, 
  Settings,
  TrendingUp,
  Sparkles,
  Menu,
  X,
  BarChart3,
  Building2,
  CreditCard
} from "lucide-react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/journal", icon: BookOpen, label: "Trade Journal" },
  { path: "/statistics", icon: BarChart3, label: "Statistics" },
  // Prop Firms handled separately for expandable nav
  { path: "/cycle", icon: Calendar, label: "Cycle Tracker" },
  { path: "/strategies", icon: TrendingUp, label: "Strategies" },
  { path: "/challenges", icon: Trophy, label: "Challenges" },
  { path: "/insights", icon: Sparkles, label: "AI Insights" },
];

export function Navigation() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPropFirmsSubnav, setShowPropFirmsSubnav] = useState(
    location.pathname.startsWith("/prop-firms") || location.pathname.startsWith("/propfirm-compare")
  );

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border bg-sidebar p-6 lg:flex"
      >
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70">
            <span className="text-lg font-bold text-primary-foreground">✨</span>
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-foreground">SheTrades</h1>
            <p className="text-xs text-muted-foreground">Empowering Women in Trading</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="mt-6">
          <Link to={`/trade/new?date=${new Date().toISOString().slice(0,10)}`}>
            <Button size="sm" className="w-full justify-center">
              <Plus className="h-3.5 w-3.5" /> New Trade
            </Button>
          </Link>
        </div>
        <div className="mt-10 flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-0 h-full w-1 rounded-full bg-primary"
                  />
                )}
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
          {/* Prop Firms expandable nav */}
          <button
            className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
              (location.pathname.startsWith("/prop-firms") || location.pathname.startsWith("/propfirm-compare"))
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            } w-full text-left`}
            onClick={() => setShowPropFirmsSubnav((v) => !v)}
            aria-expanded={showPropFirmsSubnav}
            aria-controls="propfirms-subnav"
          >
            <Building2 className="h-5 w-5" />
            Prop Firms
            <span className="ml-auto transition-transform" style={{ transform: showPropFirmsSubnav ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              ▶
            </span>
          </button>
          {showPropFirmsSubnav && (
            <div id="propfirms-subnav" className="ml-8 flex flex-col gap-1 mt-1">
              <NavLink
                to="/prop-firms"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  location.pathname === "/prop-firms"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                My Accounts
              </NavLink>
              <NavLink
                to="/propfirm-compare"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  location.pathname === "/propfirm-compare"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Prop Firm Comparison
              </NavLink>
            </div>
          )}
        </div>

        {/* Sync Status & Settings */}
        <div className="space-y-2">
          <SyncStatusIndicator />
          <NavLink
            to="/pricing"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <CreditCard className="h-5 w-5" />
            Pricing
          </NavLink>
          <NavLink
            to="/settings"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            Settings
          </NavLink>
        </div>
      </motion.nav>

      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-border bg-sidebar/95 backdrop-blur-sm p-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70">
            <span className="text-sm font-bold text-primary-foreground">✨</span>
          </div>
          <span className="font-serif text-base font-bold text-foreground">SheTrades</span>
        </div>

        <div className="flex items-center gap-2">
          <SyncStatusIndicator />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-foreground hover:bg-muted"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-sidebar/95 backdrop-blur-md p-2 lg:hidden">\n        <div className="flex items-center justify-around">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
              </NavLink>
            );
          })}
          {/* Prop Firms mobile nav button */}
          <button
            className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
              (location.pathname.startsWith("/prop-firms") || location.pathname.startsWith("/propfirm-compare"))
                ? "text-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setShowPropFirmsSubnav((v) => !v)}
            aria-expanded={showPropFirmsSubnav}
            aria-controls="propfirms-subnav-mobile"
          >
            <Building2 className="h-5 w-5" />
            <span className="text-[10px] font-medium">Prop Firms</span>
          </button>
        </div>
        {/* Mobile subnav overlay */}
        {showPropFirmsSubnav && (
          <div id="propfirms-subnav-mobile" className="absolute bottom-12 left-0 right-0 bg-sidebar border-t border-border p-2 flex flex-col gap-1 z-50">
            <NavLink
              to="/prop-firms"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                location.pathname === "/prop-firms"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => setShowPropFirmsSubnav(false)}
            >
              Prop Firm Connector
            </NavLink>
            <NavLink
              to="/metatrader"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                location.pathname === "/metatrader"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => setShowPropFirmsSubnav(false)}
            >
              MetaTrader Connection
            </NavLink>
            <NavLink
              to="/propfirm-compare"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                location.pathname === "/propfirm-compare"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => setShowPropFirmsSubnav(false)}
            >
              Prop Firm Comparison
            </NavLink>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-30 bg-background/95 backdrop-blur-sm pt-16 lg:hidden"
        >
          <div className="flex flex-col gap-2 p-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-foreground hover:bg-muted"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
            {/* Prop Firms expandable in mobile menu */}
            <button
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-foreground hover:bg-muted w-full text-left mt-2 ${
                (location.pathname.startsWith("/prop-firms") || location.pathname.startsWith("/propfirm-compare"))
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => setShowPropFirmsSubnav((v) => !v)}
              aria-expanded={showPropFirmsSubnav}
              aria-controls="propfirms-subnav-mobile-menu"
            >
              <Building2 className="h-5 w-5" />
              Prop Firms
              <span className="ml-auto transition-transform" style={{ transform: showPropFirmsSubnav ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ▶
              </span>
            </button>
            {showPropFirmsSubnav && (
              <div id="propfirms-subnav-mobile-menu" className="ml-8 flex flex-col gap-1 mt-1">
                <NavLink
                  to="/prop-firms"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    location.pathname === "/prop-firms"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  Overview
                </NavLink>
                <NavLink
                  to="/metatrader"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    location.pathname === "/metatrader"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  MetaTrader
                </NavLink>
                <NavLink
                  to="/propfirm-compare"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    location.pathname === "/propfirm-compare"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  Prop Firm Comparison
                </NavLink>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
