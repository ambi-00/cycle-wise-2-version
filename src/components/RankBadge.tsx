import { RANKS } from "@/lib/supabaseHelpers";

interface RankBadgeProps {
  rank: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function RankBadge({ rank, size = 'md', showName = true }: RankBadgeProps) {
  const rankData = RANKS[rank as keyof typeof RANKS] || RANKS.bronze;

  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-base px-3 py-1',
    lg: 'text-lg px-4 py-2',
  };

  const iconSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-secondary/20 to-accent/20 ${sizeClasses[size]} font-medium`}>
      <span className={iconSizes[size]}>{rankData.icon}</span>
      {showName && <span className="text-foreground">{rankData.name}</span>}
    </div>
  );
}
