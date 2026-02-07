import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Info } from "lucide-react";
import CyclePhaseCard, { CyclePhase, phaseData } from "./CyclePhaseCard";

const LandingCycleTracker = () => {
  const [cycleDay, setCycleDay] = useState(20);
  const cycleLength = 28;

  const getPhase = (day: number): CyclePhase => {
    if (day <= 5) return "menstrual";
    if (day <= 14) return "follicular";
    if (day <= 17) return "ovulatory";
    return "luteal";
  };

  const currentPhase = getPhase(cycleDay);

  const phases: { phase: CyclePhase; start: number; end: number }[] = [
    { phase: "menstrual", start: 1, end: 5 },
    { phase: "follicular", start: 6, end: 14 },
    { phase: "ovulatory", start: 15, end: 17 },
    { phase: "luteal", start: 18, end: 28 },
  ];

  const getPhaseColorClass = (phase: CyclePhase) => {
    const colors = {
      menstrual: "bg-cycle-menstruation",
      follicular: "bg-cycle-follicular",
      ovulatory: "bg-cycle-ovulation",
      luteal: "bg-cycle-luteal",
    };
    return colors[phase];
  };

  const getPhaseTextColorClass = (phase: CyclePhase) => {
    const colors = {
      menstrual: "text-cycle-menstruation",
      follicular: "text-cycle-follicular",
      ovulatory: "text-cycle-ovulation",
      luteal: "text-cycle-luteal",
    };
    return colors[phase];
  };

  return (
    <section id="cycle-tracker" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[800px] rounded-full bg-accent/5 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary mb-6">
            <Calendar className="h-4 w-4" />
            <span>Sync Your Cycle with Your Trading</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Trade With Your
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Natural Rhythm</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your hormones affect your decision-making. Learn when to push and when to pause.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Interactive Cycle Wheel */}
          <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-8 mb-8 shadow-card">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Cycle Day Selector */}
              <div className="flex-1 text-center">
                <p className="text-sm text-muted-foreground mb-2">Current Cycle Day</p>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => setCycleDay(Math.max(1, cycleDay - 1))}
                    className="h-10 w-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="relative">
                    <div className={`text-7xl font-bold font-mono ${getPhaseTextColorClass(currentPhase)}`}>
                      {cycleDay}
                    </div>
                    <span className="text-sm text-muted-foreground">of {cycleLength}</span>
                  </div>
                  <button
                    onClick={() => setCycleDay(Math.min(cycleLength, cycleDay + 1))}
                    className="h-10 w-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Cycle Progress Bar */}
                <div className="relative h-3 rounded-full bg-secondary overflow-hidden mb-4">
                  {phases.map(({ phase, start, end }) => (
                    <div
                      key={phase}
                      className={`absolute h-full ${getPhaseColorClass(phase)}`}
                      style={{
                        left: `${((start - 1) / cycleLength) * 100}%`,
                        width: `${((end - start + 1) / cycleLength) * 100}%`,
                      }}
                    />
                  ))}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-foreground border-2 border-background shadow-lg transition-all duration-300"
                    style={{ left: `calc(${((cycleDay - 0.5) / cycleLength) * 100}% - 8px)` }}
                  />
                </div>

                {/* Phase Labels */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Menstrual</span>
                  <span>Follicular</span>
                  <span>Ovulatory</span>
                  <span>Luteal</span>
                </div>
              </div>

              {/* Current Phase Info */}
              <div className="flex-1 w-full">
                <CyclePhaseCard phase={currentPhase} isActive />
              </div>
            </div>
          </div>

          {/* All Phases Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(phaseData) as CyclePhase[]).map((phase) => (
              <CyclePhaseCard
                key={phase}
                phase={phase}
                compact
                isActive={phase === currentPhase}
              />
            ))}
          </div>

          {/* Tip */}
          <div className="mt-8 flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 p-4">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary mb-1">Pro Tip</p>
              <p className="text-sm text-muted-foreground">
                Track your cycle alongside your trades for 2-3 months. You'll discover patterns in your trading behavior that align with your hormonal phases - knowledge you can use to optimize your strategy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingCycleTracker;
