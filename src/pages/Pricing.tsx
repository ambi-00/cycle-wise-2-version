import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/use-subscription';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const tiers = [
  {
    name: 'Free',
    price: '€0',
    period: 'forever',
    description: 'Perfect for getting started',
    explanation: 'Start tracking your trades and build the foundation. Perfect for understanding the basics of your trading patterns.',
    icon: Check,
    color: 'text-gray-500',
    bgGradient: 'from-gray-100 to-gray-200',
    features: [
      'Basic trade tracking',
      'Dashboard & Day View',
      'Up to 50 trades per month',
      'Trade Journal (basic filters)',
      'Basic Statistics',
      '2 screenshots (1 before + 1 after)',
      'Challenges & Gamification',
      'PropFirm Compare Tool',
    ],
    limitations: [
      'No Cycle Tracking',
      'No AI Insights',
      'No PropFirm Integration',
      'Limited Strategy Management',
    ],
  },
  {
    name: 'Premium',
    price: '€9.99',
    period: 'per month',
    description: 'For serious traders',
    explanation: 'Discover what truly impacts your trading. Recognize how your menstrual cycle, emotions, and external factors influence your decisions. Master the hidden forces behind your trades.',
    icon: Sparkles,
    color: 'text-blue-500',
    bgGradient: 'from-blue-100 to-blue-200',
    popular: true,
    features: [
      'Everything in Free, plus:',
      '✨ 100 trades per month',
      '✨ Cycle Tracking & Analysis',
      '✨ Advanced filters & statistics',
      '✨ 4 screenshots (2 before + 2 after)',
      '✨ Ideal RRR Calculator',
      '✨ Ideal SL Size Calculator',
      '✨ PropFirm discount codes',
      '✨ Full Strategy Management',
      '✨ Cloud Sync',
      '✨ Export reports',
      '✨ Custom trade reasons',
    ],
    cta: 'Start Premium',
  },
  {
    name: 'Pro',
    price: '€19.99',
    period: 'per month',
    description: 'Ultimate trading toolkit',
    explanation: 'Your cheat code to profitability. AI does the heavy lifting - analyzing every pattern, identifying what works, and telling you exactly what to fix. Skip years of trial and error. This is the fastest way to unlock consistent profits.',
    icon: Zap,
    color: 'text-purple-500',
    bgGradient: 'from-purple-100 to-purple-200',
    features: [
      'Everything in Premium, plus:',
      '⚡ Unlimited trades',
      '⚡ PropFirm Integration',
      '⚡ AI Insights (daily)',
      '⚡ Safety Mode',
      '⚡ Advanced risk analytics',
      '⚡ Priority support',
      '⚡ Early access to new features',
    ],
    cta: 'Go Pro',
  },
];

export default function Pricing() {
  const { subscription, hasFeature } = useSubscription();
  const navigate = useNavigate();

  const handleUpgrade = (tierName: string) => {
    // Stripe Payment Links
    const paymentLinks = {
      premium: 'https://buy.stripe.com/test_28E8wO7ZpfZNblVdiu0x203',
      pro: 'https://buy.stripe.com/test_14A8wOa7x5l9du36U60x202',
    };
    
    const link = paymentLinks[tierName.toLowerCase() as keyof typeof paymentLinks];
    if (link) {
      window.location.href = link;
    }
  };

  const handleManageSubscription = () => {
    // Navigate to Stripe Customer Portal or Supabase dashboard
    const stripeCustomerPortalUrl = 'https://billing.stripe.com/p/login/test';
    window.location.href = stripeCustomerPortalUrl;
  };

  const currentTierName = subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1);

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <div className="container mx-auto px-6 md:px-12 lg:px-24 py-12 max-w-7xl">{/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your Trading Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock powerful features to take your trading to the next level
        </p>
        
        {/* Current Plan Badge */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-sm px-4 py-2">
            Current Plan: <span className="font-bold ml-1">{currentTierName}</span>
          </Badge>
          {subscription.tier !== 'free' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManageSubscription}
            >
              Manage Subscription
            </Button>
          )}
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-6xl mx-auto">
        {tiers.map((tier, index) => {
          const Icon = tier.icon;
          const isCurrentTier = subscription.tier === tier.name.toLowerCase();
          const canUpgrade = 
            (tier.name === 'Premium' && subscription.tier === 'free') ||
            (tier.name === 'Pro' && (subscription.tier === 'free' || subscription.tier === 'premium'));

          return (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <Card className={`h-full ${tier.popular ? 'border-2 border-primary shadow-lg' : ''} ${isCurrentTier ? 'ring-2 ring-green-500' : ''}`}>
                <CardHeader>
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${tier.bgGradient}`}>
                      <Icon className={`h-6 w-6 ${tier.color}`} />
                    </div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">/{tier.period}</span>
                  </div>
                  
                  <CardDescription className="text-base mb-2">
                    {tier.description}
                  </CardDescription>
                  
                  {/* Explanation */}
                  {tier.explanation && (
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      {tier.explanation}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <ul className="space-y-2">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Limitations (only for Free) */}
                  {tier.limitations && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Not included:</p>
                      <ul className="space-y-1">
                        {tier.limitations.map((limit, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="text-red-400">×</span>
                            <span>{limit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  {isCurrentTier ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : canUpgrade ? (
                    <Button
                      className="w-full"
                      variant={tier.popular ? 'default' : 'outline'}
                      onClick={() => handleUpgrade(tier.name)}
                    >
                      {tier.cta || `Choose ${tier.name}`}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled
                    >
                      {tier.name === 'Free' ? 'Basic Plan' : 'Contact Sales'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Feature Comparison</CardTitle>
            <CardDescription>See exactly what you get with each plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold">Free</th>
                    <th className="text-center py-3 px-4 font-semibold">Premium</th>
                    <th className="text-center py-3 px-4 font-semibold">Pro</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-3 px-4">Trades per month</td>
                    <td className="text-center">50</td>
                    <td className="text-center">100</td>
                    <td className="text-center">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Screenshots per trade</td>
                    <td className="text-center">2 (1+1)</td>
                    <td className="text-center">4 (2+2)</td>
                    <td className="text-center">4 (2+2)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Cycle Tracking</td>
                    <td className="text-center text-muted-foreground">–</td>
                    <td className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">AI Insights</td>
                    <td className="text-center text-muted-foreground">–</td>
                    <td className="text-center text-muted-foreground">–</td>
                    <td className="text-center">Daily</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">PropFirm Integration</td>
                    <td className="text-center text-muted-foreground">–</td>
                    <td className="text-center text-muted-foreground">–</td>
                    <td className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Safety Mode</td>
                    <td className="text-center text-muted-foreground">–</td>
                    <td className="text-center text-muted-foreground">–</td>
                    <td className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Strategy Management</td>
                    <td className="text-center text-muted-foreground">Limited</td>
                    <td className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Advanced Filters</td>
                    <td className="text-center text-muted-foreground">–</td>
                    <td className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Cloud Sync</td>
                    <td className="text-center text-muted-foreground">–</td>
                    <td className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">PropFirm Comparison Tool</td>
                    <td className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center">
                      <div className="flex flex-col items-center">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">(mit exklusiven Discounts)</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">(mit exklusiven Discounts)</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">PropFirm Discount Codes</td>
                    <td className="text-center text-muted-foreground">–</td>
                    <td className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Support</td>
                    <td className="text-center">Email</td>
                    <td className="text-center">Email</td>
                    <td className="text-center">Priority</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ or Additional Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Need help choosing? <a href="mailto:support@shetrades.com" className="underline">Contact us</a>
        </p>
      </motion.div>
      </div>
    </main>
  );
}
