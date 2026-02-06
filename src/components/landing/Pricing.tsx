import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    description: "Perfect for getting started",
    explanation: "Start tracking your trades and build the foundation. Perfect for understanding the basics of your trading patterns.",
    features: [
      "50 trades/month",
      "Basic cycle tracking",
      "Trade journal with basic filters",
      "Day view & mood tracking",
      "2 screenshots (1 before + 1 after)",
      "1 strategy",
      "Local storage only",
      "Community access",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Premium",
    price: "€9.99",
    period: "per month",
    description: "For serious traders",
    explanation: "Discover what truly impacts your trading. Recognize how your menstrual cycle, emotions, and external factors influence your decisions.",
    features: [
      "100 trades/month",
      "Full cycle tracker",
      "Unlimited strategies",
      "Advanced statistics",
      "Ideal RRR Calculator",
      "Ideal SL Size Calculator",
      "PropFirm discount codes",
      "4 screenshots (2 before + 2 after)",
      "Cloud backup & multi-device sync",
      "Advanced filters & analytics",
      "Custom win/loss reasons",
      "Export reports",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Pro",
    price: "€19.99",
    period: "per month",
    description: "For professional traders",
    explanation: "Your cheat code to profitability. AI does the heavy lifting - skip years of trial and error. The fastest way to unlock consistent profits.",
    features: [
      "Everything in Premium",
      "Unlimited trades",
      "AI insights (daily)",
      "Smart cycle predictions",
      "Personalized trading tips",
      "PropFirm integration (unlimited)",
      "Safety Mode browser extension",
      "Advanced risk analytics",
      "Early access to new features",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary mb-6"
          >
            <Sparkles className="h-4 w-4" />
            <span>Simple Pricing</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl md:text-5xl font-bold mb-4"
          >
            Start free,
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              scale as you grow
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            No credit card required. Cancel anytime.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl border p-8 ${
                plan.popular
                  ? "border-primary bg-card shadow-glow"
                  : "border-border/50 bg-card/80"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-xl mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                {plan.explanation && (
                  <p className="text-xs text-muted-foreground mt-3 italic leading-relaxed">
                    {plan.explanation}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full rounded-full ${
                  plan.popular ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
                variant={plan.popular ? "default" : "secondary"}
              >
                <Link to={plan.name === 'Free' ? '/register' : `/checkout?tier=${plan.name.toLowerCase()}`}>
                  {plan.cta}
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
