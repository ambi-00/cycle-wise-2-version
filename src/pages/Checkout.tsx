import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '@/hooks/use-subscription';
import { CreditCard, Lock, ArrowLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabaseClient } from '@/lib/supabaseClient';

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit Card',
    icon: '💳',
    description: 'Visa, Mastercard, Amex',
    supported: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '🅿️',
    description: 'Pay with your PayPal account',
    supported: true,
  },
  {
    id: 'sepa',
    name: 'SEPA Direct Debit',
    icon: '🏦',
    description: 'European bank transfer',
    supported: true,
  },
  {
    id: 'sofort',
    name: 'Sofort',
    icon: '⚡',
    description: 'Instant bank transfer',
    supported: true,
  },
];

const tierDetails = {
  premium: {
    name: 'Premium',
    price: '€9.99',
    period: 'per month',
    features: [
      '100 trades per month',
      'Full Cycle Tracking',
      'Advanced Statistics',
      'Ideal RRR Calculator',
      'Ideal SL Size Calculator',
      'PropFirm discount codes',
      'Cloud Sync',
      '4 screenshots (2 before + 2 after)',
      'Full Strategy Management',
    ],
  },
  pro: {
    name: 'Pro',
    price: '€19.99',
    period: 'per month',
    features: [
      'Everything in Premium',
      'Unlimited trades',
      'PropFirm Integration',
      'AI Insights (daily)',
      'Safety Mode',
      'Priority Support',
    ],
  },
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const [selectedPayment, setSelectedPayment] = useState<string>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const tier = (searchParams.get('tier') || 'premium') as 'premium' | 'pro';
  const plan = tierDetails[tier];

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Get current user ID from Supabase auth
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Integrate with Stripe Checkout
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tier,
          paymentMethod: selectedPayment,
          userId: user.id,
        })
      });
      
      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment processing failed. Please try again or contact support.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/pricing')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pricing
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Complete Your Purchase
          </h1>
          <p className="text-muted-foreground">
            Choose your payment method to unlock {plan.name}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Payment Methods */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Select how you'd like to pay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    disabled={!method.supported}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPayment === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    } ${!method.supported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <div className="font-semibold">{method.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {method.description}
                          </div>
                        </div>
                      </div>
                      {selectedPayment === method.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Secured by Stripe. Your payment information is encrypted.</span>
            </div>
          </motion.div>

          {/* Right: Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Summary</CardTitle>
                  <Badge variant={tier === 'pro' ? 'default' : 'secondary'}>
                    {plan.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price */}
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-muted-foreground">
                      {plan.name} Subscription
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Billed monthly, cancel anytime
                  </p>
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-semibold mb-3">What's included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Current Plan Info */}
                {subscription.tier !== 'free' && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Current plan: <strong>{subscription.tier}</strong>
                    </p>
                    {tier === 'pro' && subscription.tier === 'premium' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        You'll be charged €10 difference for this billing period
                      </p>
                    )}
                  </div>
                )}

                {/* Total */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total due today</span>
                    <span>{plan.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Subscription starts immediately
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Complete Purchase
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
