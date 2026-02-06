import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    target: ".challenges-header",
    title: "Weekly Challenges 🏆",
    description: "Compete with other traders and earn badges for your achievements!",
    position: "bottom" as const,
  },
  {
    target: ".challenge-privacy-button",
    title: "Privacy Settings 🔒",
    description: "Control your visibility on leaderboards. Choose between Private, Leaderboard only, or Public to share your progress with the community.",
    position: "left" as const,
  },
  {
    target: ".leaderboard-tabs",
    title: "Multiple Rankings 📊",
    description: "Track different aspects: Profit, Discipline, Risk Management, and Cycle-Aligned Trading. Switch between Weekly, Monthly, and All-Time XP rankings!",
    position: "bottom" as const,
  },
];

export default function ChallengesTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("cw_tour_challenges");
    if (!hasSeenTour) {
      setTimeout(() => setIsActive(true), 500);
    }
  }, []);

  useEffect(() => {
    if (isActive && steps[currentStep]) {
      const target = document.querySelector(steps[currentStep].target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
      }
    }
  }, [isActive, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsActive(false);
    localStorage.setItem("cw_tour_challenges", "true");
  };

  if (!isActive) return null;

  const step = steps[currentStep];
  
  // Tooltip dimensions and padding
  const tooltipWidth = 384; // max-w-sm
  const tooltipHeight = 300; // estimated height
  const padding = 20;
  
  // Calculate initial position
  let tooltipX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth / 2;
  let tooltipY = targetRect
    ? step.position === "bottom"
      ? targetRect.bottom + 20
      : targetRect.top + targetRect.height / 2
    : padding;
  
  let tooltipTransform = "translateX(-50%)";
  
  // Handle left positioning
  if (step.position === "left" && targetRect) {
    tooltipX = targetRect.left - 20;
    tooltipTransform = "translateX(-100%) translateY(-50%)";
    
    // If would go off left edge, show on right instead
    if (tooltipX - tooltipWidth < padding) {
      tooltipX = targetRect.right + 20;
      tooltipTransform = "translateY(-50%)";
    }
    
    // Check right boundary for right-positioned tooltip
    if (tooltipX + tooltipWidth > window.innerWidth - padding) {
      tooltipX = targetRect.left - 20;
      tooltipTransform = "translateX(-100%) translateY(-50%)";
    }
  }
  
  // Horizontal boundary checks for center-positioned tooltips
  if (step.position !== "left") {
    const maxX = window.innerWidth - tooltipWidth / 2 - padding;
    const minX = tooltipWidth / 2 + padding;
    if (tooltipX > maxX) tooltipX = maxX;
    if (tooltipX < minX) tooltipX = minX;
  }
  
  // Vertical boundary checks
  const maxY = window.innerHeight - tooltipHeight - padding;
  const minY = padding;
  if (tooltipY > maxY) tooltipY = maxY;
  if (tooltipY < minY) tooltipY = minY;

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={handleClose}
          />

          {/* Spotlight on target */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed z-[101] pointer-events-none"
              style={{
                left: targetRect.left - 8,
                top: targetRect.top - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                boxShadow: "0 0 0 4px rgba(345, 60%, 65%, 0.5), 0 0 0 9999px rgba(0,0,0,0.6)",
                borderRadius: "12px",
              }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed z-[102] max-w-sm"
            style={{
              left: step.position === "left" ? targetRect?.left : tooltipX,
              top: tooltipY,
              transform: tooltipTransform,
            }}
          >
            <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-serif text-xl font-bold text-foreground">
                  {step.title}
                </h3>
                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-muted-foreground mb-6">{step.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {steps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 w-2 rounded-full ${
                        idx === currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button variant="outline" size="sm" onClick={handlePrev}>
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  )}
                  <Button size="sm" onClick={handleNext}>
                    {currentStep === steps.length - 1 ? "Got it!" : "Next"}
                    {currentStep < steps.length - 1 && (
                      <ArrowRight className="h-4 w-4 ml-1" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
