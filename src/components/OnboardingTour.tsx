import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: "top" | "bottom" | "left" | "right";
  action?: () => void;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to CycleWise! 🎉",
    description: "Let's take a quick tour to help you get started. This will only take 2 minutes.",
    position: "bottom",
  },
  {
    id: "dashboard",
    title: "Your Dashboard",
    description: "This is your central hub. See your performance, XP progress, and recent trades at a glance.",
    target: ".dashboard-header",
    position: "bottom",
  },
  {
    id: "cycle-tracker",
    title: "Track Your Cycle 🌙",
    description: "CycleWise's superpower! Track your menstrual cycle and see how it affects your trading performance.",
    target: "[href='/cycle']",
    position: "right",
  },
  {
    id: "new-trade",
    title: "Log Your First Trade",
    description: "Use this button to quickly add trades. The more data you track, the better insights you'll get!",
    target: ".new-trade-button",
    position: "right",
  },
  {
    id: "xp-system",
    title: "Earn XP & Climb Ranks ⚡",
    description: "Earn XP from compliant trades, login streaks, and more. Compete on leaderboards!",
    target: ".xp-bar",
    position: "bottom",
  },
  {
    id: "challenges",
    title: "Join Weekly Challenges 🏆",
    description: "Compete with other traders, earn badges, and improve your skills together.",
    target: "[href='/challenges']",
    position: "right",
  },
  {
    id: "complete",
    title: "You're All Set! ✨",
    description: "Ready to start your trading journey? Remember: consistency is key!",
    position: "bottom",
  },
];

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  useEffect(() => {
    // Check if user has completed tour
    const completed = localStorage.getItem("cw_onboarding_completed");
    if (!completed) {
      // Show tour after 1 second delay
      setTimeout(() => setIsOpen(true), 1000);
    } else {
      setHasCompletedTour(true);
    }
  }, []);

  const currentTourStep = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      completeTour();
    } else {
      setCurrentStep((prev) => prev + 1);
      currentTourStep.action?.();
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    // Don't mark as completed so they can restart
  };

  const completeTour = () => {
    localStorage.setItem("cw_onboarding_completed", "true");
    setHasCompletedTour(true);
    setIsOpen(false);
  };

  // Get position of target element
  const getTargetPosition = () => {
    if (!currentTourStep.target) return null;
    const element = document.querySelector(currentTourStep.target);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return rect;
  };

  const targetRect = getTargetPosition();

  if (hasCompletedTour && !isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleSkip}
          />

          {/* Highlight target element */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[101] pointer-events-none"
              style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                boxShadow: "0 0 0 4px rgba(345, 60%, 65%, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6)",
                borderRadius: "12px",
              }}
            />
          )}

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed z-[102] max-w-[90vw]"
            style={
              targetRect && currentTourStep.position
                ? calculateBoundedTooltipPosition(targetRect, currentTourStep.position)
                : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
            }
          >
            <Card className="w-[380px] max-w-[90vw] shadow-2xl border-2 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                      {currentStep + 1}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      of {tourSteps.length}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                  {currentTourStep.title}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {currentTourStep.description}
                </p>

                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <Button
                      variant="outline"
                      onClick={handlePrev}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  )}
                  <Button onClick={handleNext} className="flex-1">
                    {isLastStep ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Get Started
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  {tourSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentStep
                          ? "w-6 bg-primary"
                          : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function calculateBoundedTooltipPosition(
  targetRect: DOMRect,
  position: "top" | "bottom" | "left" | "right"
): React.CSSProperties {
  // Tooltip dimensions for boundary calculation
  const tooltipWidth = 380; // w-[380px]
  const tooltipHeight = 340; // estimated height with all content
  const offset = 20;
  const padding = 16; // screen padding
  
  // Calculate base position
  const basePosX = targetRect.left + targetRect.width / 2;
  const basePosY = position === "bottom" 
    ? targetRect.bottom + offset
    : position === "top"
    ? targetRect.top - offset - tooltipHeight
    : targetRect.top + targetRect.height / 2;
  
  // Apply horizontal boundary checks
  let finalX = basePosX;
  const maxX = window.innerWidth - tooltipWidth / 2 - padding;
  const minX = tooltipWidth / 2 + padding;
  if (finalX > maxX) finalX = maxX;
  if (finalX < minX) finalX = minX;
  
  // Apply vertical boundary checks
  let finalY = basePosY;
  const maxY = window.innerHeight - tooltipHeight - padding;
  const minY = padding;
  if (finalY > maxY) finalY = maxY;
  if (finalY < minY) finalY = minY;
  
  // Return position based on where card needs to be
  if (position === "left" || position === "right") {
    return {
      top: finalY,
      left: position === "right" ? targetRect.right + offset : targetRect.left - offset - tooltipWidth,
      transform: "translateY(-50%)",
    };
  }
  
  // Default for top/bottom
  return {
    top: finalY,
    left: finalX,
    transform: "translateX(-50%)",
  };
}

function getTooltipPosition(
  targetRect: DOMRect,
  position: "top" | "bottom" | "left" | "right"
): React.CSSProperties {
  const offset = 20;

  switch (position) {
    case "top":
      return {
        top: targetRect.top - offset,
        left: targetRect.left + targetRect.width / 2,
        transform: "translate(-50%, -100%)",
      };
    case "bottom":
      return {
        top: targetRect.bottom + offset,
        left: targetRect.left + targetRect.width / 2,
        transform: "translate(-50%, 0)",
      };
    case "left":
      return {
        top: targetRect.top + targetRect.height / 2,
        left: targetRect.left - offset,
        transform: "translate(-100%, -50%)",
      };
    case "right":
      return {
        top: targetRect.top + targetRect.height / 2,
        left: targetRect.right + offset,
        transform: "translate(0, -50%)",
      };
    default:
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
  }
}
