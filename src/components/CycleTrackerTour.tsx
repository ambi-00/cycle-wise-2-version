import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    target: ".cycle-calendar",
    title: "Your Cycle Calendar 📅",
    description: "Track your menstrual cycle and see how different phases affect your trading performance.",
    position: "bottom" as const,
  },
  {
    target: ".cycle-predictions",
    title: "Smart Predictions 🔮",
    description: "Based on your data, we predict when your next period starts and identify your optimal trading windows.",
    position: "bottom" as const,
  },
  {
    target: ".safety-mode-button",
    title: "Safety Mode 🛡️",
    description: "Enable Safety Mode during PMS or other high-risk phases to protect yourself from taking excessive risk.",
    position: "left" as const,
  },
];

export default function CycleTrackerTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("cw_tour_cycle");
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
    localStorage.setItem("cw_tour_cycle", "true");
  };

  if (!isActive) return null;

  const step = steps[currentStep];
  
  // Tooltip dimensions and padding
  const tooltipWidth = 384; // max-w-sm
  const tooltipHeight = 240; // actual estimated height
  const padding = 16;
  const gap = 12;
  
  // Calculate initial position
  let tooltipX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth / 2;
  let tooltipY = 0;
  let tooltipTransform = "translateX(-50%)";
  
  // Position based on preference
  if (step.position === "bottom") {
    tooltipY = targetRect ? targetRect.bottom + gap : padding;
  } else if (step.position === "top") {
    tooltipY = targetRect ? targetRect.top - tooltipHeight - gap : padding;
  } else if (step.position === "left") {
    tooltipX = targetRect ? targetRect.left - gap : padding;
    tooltipY = targetRect ? targetRect.top + targetRect.height / 2 : padding;
    tooltipTransform = "translateX(-100%) translateY(-50%)";
  } else if (step.position === "right") {
    tooltipX = targetRect ? targetRect.right + gap : padding;
    tooltipY = targetRect ? targetRect.top + targetRect.height / 2 : padding;
    tooltipTransform = "translateY(-50%)";
  }
  
  // Vertical boundary checks with flipping
  const maxY = window.innerHeight - tooltipHeight - padding;
  const minY = padding;
  
  if ((step.position === "bottom" || step.position === "top") && (tooltipY > maxY || tooltipY < minY)) {
    // Try opposite vertical position
    if (step.position === "bottom") {
      const topPosition = targetRect ? targetRect.top - tooltipHeight - gap : padding;
      if (topPosition >= minY) {
        tooltipY = topPosition;
      } else {
        tooltipY = Math.max(minY, Math.min(maxY, tooltipY));
      }
    } else {
      const bottomPosition = targetRect ? targetRect.bottom + gap : padding;
      if (bottomPosition <= maxY) {
        tooltipY = bottomPosition;
      } else {
        tooltipY = Math.max(minY, Math.min(maxY, tooltipY));
      }
    }
  } else if (step.position === "left" || step.position === "right") {
    // Center vertically on target, but keep in viewport
    tooltipY = Math.max(minY, Math.min(maxY, tooltipY));
  }
  
  // Horizontal boundary checks
  const maxX = window.innerWidth - padding;
  const minX = padding;
  
  if (step.position === "left") {
    // Check if left position would overflow
    if (tooltipX - tooltipWidth < minX) {
      tooltipX = targetRect ? targetRect.right + gap : padding;
      tooltipTransform = "translateY(-50%)";
    }
  } else if (step.position === "right") {
    // Check if right position would overflow
    if (tooltipX + tooltipWidth > maxX) {
      tooltipX = targetRect ? targetRect.left - gap : padding;
      tooltipTransform = "translateX(-100%) translateY(-50%)";
    }
  } else {
    // Center positioned - keep centered when possible
    const halfWidth = tooltipWidth / 2;
    if (tooltipX - halfWidth < minX) {
      tooltipX = halfWidth + padding;
    } else if (tooltipX + halfWidth > maxX) {
      tooltipX = maxX - halfWidth - padding;
    }
  }

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
