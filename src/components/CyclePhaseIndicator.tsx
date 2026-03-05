import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Moon, Sun, Sparkles, Cloud } from "lucide-react";

type CyclePhase = "menstruation" | "follicular" | "ovulation" | "luteal";

interface CyclePhaseIndicatorProps {
  phase: CyclePhase;
  day: number;
  recommendation: string;
  cycleLength?: number; // Optional, defaults to 28
  isPeriodLogged?: boolean; // Is today's period actually logged (vs predicted)
}

const phaseConfig = {
  menstruation: {
    icon: Moon,
    label: "Menstruation",
    color: "bg-cycle-menstruation",
    colorLight: "bg-cycle-menstruation/50", // Lighter for predicted periods
    gradient: "from-red-400/20 to-pink-400/20",
    description: "Rest & reflect phase",
  },
  follicular: {
    icon: Sun,
    label: "Follicular",
    color: "bg-cycle-follicular",
    gradient: "from-yellow-300/15 to-amber-200/15",
    description: "Energy rising phase",
  },
  ovulation: {
    icon: Sparkles,
    label: "Ovulation",
    color: "bg-cycle-ovulation",
    gradient: "from-emerald-300/15 to-teal-300/15",
    description: "Peak clarity phase",
  },
  luteal: {
    icon: Cloud,
    label: "Luteal",
    color: "bg-cycle-luteal",
    gradient: "from-purple-400/20 to-violet-400/20",
    description: "Wind down phase",
  },
};

export function CyclePhaseIndicator({ phase, day, recommendation, cycleLength = 28, isPeriodLogged = false }: CyclePhaseIndicatorProps) {
  const config = phaseConfig[phase];
  const Icon = config.icon;
  
  // Calculate cycle progress percentage
  const progressPercentage = (day / cycleLength) * 100;
  const circumference = 176; // 2 * PI * radius (28)
  
  // Use lighter color for predicted menstruation, darker for logged
  const iconBgColor = phase === 'menstruation' && !isPeriodLogged 
    ? config.colorLight 
    : config.color;
  
  // Ring color - lighter for predicted period
  const ringColorClass = phase === 'menstruation' && !isPeriodLogged 
    ? 'text-cycle-menstruation/50' 
    : config.color.replace("bg-", "text-");

  return (
    <Link to={`/day/${day}`} aria-label={`Open day ${day} in Cycle Tracker`}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-6 shadow-card`}
    >
      {/* Decorative background circles */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBgColor} text-white shadow-soft`}
            >
              <Icon className="h-6 w-6" />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{config.description}</p>
              <h3 className="text-xl font-serif font-semibold text-foreground">{config.label}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-foreground">Day {day}</span>
            <span className="text-muted-foreground">of your cycle</span>
          </div>
        </div>

        {/* Cycle progress ring */}
        <div className="relative h-16 w-16">
          <svg className="h-16 w-16 -rotate-90 transform">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-muted/30"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              className={ringColorClass}
              initial={{ strokeDasharray: "0 176" }}
              animate={{ strokeDasharray: `${(progressPercentage / 100) * circumference} ${circumference}` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 rounded-xl bg-white/50 p-4"
      >
        <p className="text-sm font-medium text-foreground">
          💡 <span className="text-muted-foreground">{recommendation}</span>
        </p>
      </motion.div>
    </motion.div>
    </Link>
  );
}
