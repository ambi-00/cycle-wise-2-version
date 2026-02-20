import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, Percent } from "lucide-react";

interface PerformanceCardProps {
  title: string;
  value: string | number;
  change?: number;
  type: "currency" | "percentage" | "count" | "ratio";
  icon?: "trending" | "target" | "percent";
}

export function PerformanceCard({ title, value, change, type, icon = "trending" }: PerformanceCardProps) {
  const isPositive = change !== undefined && change >= 0;
  
  const formatValue = () => {
    if (type === "currency") return `$${value.toLocaleString()}`;
    if (type === "percentage") return `${value}%`;
    if (type === "ratio") return `${value}R`;
    return value;
  };

  const IconComponent = icon === "target" ? Target : icon === "percent" ? Percent : isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group rounded-2xl bg-card p-5 shadow-card transition-all duration-300 hover:shadow-glow"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{formatValue()}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${
          isPositive ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive"
        }`}>
          <IconComponent className="h-5 w-5" />
        </div>
      </div>
      
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`text-sm font-medium tabular-nums ${isPositive ? "text-emerald-600" : "text-destructive"}`}>
            {isPositive ? "+" : ""}{change}%
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}
