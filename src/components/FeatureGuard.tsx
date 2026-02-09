import { ReactNode } from 'react';
import { useSubscription, Feature, SubscriptionTier } from '@/hooks/use-subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureGuardProps {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
  requiredTier?: SubscriptionTier;
}

export function FeatureGuard({ feature, children, fallback, requiredTier }: FeatureGuardProps) {
  const { hasFeature, subscription } = useSubscription();
  const navigate = useNavigate();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Determine which tier is required
  const tierNeeded = requiredTier || (feature.includes('pro') ? 'pro' : 'premium');
  const tierIcon = tierNeeded === 'pro' ? <Zap className="h-12 w-12" /> : <Sparkles className="h-12 w-12" />;
  const tierColor = tierNeeded === 'pro' ? 'text-purple-500' : 'text-blue-500';
  const tierName = tierNeeded === 'pro' ? 'Pro' : 'Premium';
  const tierPrice = tierNeeded === 'pro' ? '€19.99' : '€9.99';

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-lg w-full border-2">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 ${tierColor}`}>
            {tierIcon}
          </div>
          <CardTitle className="text-2xl">Upgrade to {tierName}</CardTitle>
          <CardDescription className="text-base">
            This feature requires a {tierName} subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Current plan: {subscription.tier.toUpperCase()}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Unlock this feature and more with {tierName} for just {tierPrice}/month
            </p>
          </div>
          
          <div className="space-y-2">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate(`/checkout?tier=${requiredTier}&returnTo=${window.location.pathname}`)}
            >
              Upgrade to {tierName}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
