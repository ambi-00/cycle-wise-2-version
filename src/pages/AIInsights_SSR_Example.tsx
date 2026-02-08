import { useServerSideData } from '@/lib/serverSideLoad';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Beispiel Page - mit Server-Side-ähnlichem Loading
 * Tier ist BEKANNT bevor Komponente rendert
 */
export default function AIInsights() {
  const { data, loading } = useServerSideData();

  // Loading: blank screen (kein Flackern)
  if (loading || !data) {
    return <div className="min-h-screen bg-background" />;
  }

  const { user, tier } = data;

  // Ab hier: tier ist GARANTIERT geladen
  // Kein Flackern, keine Locks, keine Upsells!

  return (
    <div className="min-h-screen bg-background">
      <h1>AI Insights</h1>

      {tier === 'free' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <p>Upgrade to Pro für AI Insights</p>
          </CardContent>
        </Card>
      )}

      {tier === 'premium' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <p>Premium Features verfügbar</p>
          </CardContent>
        </Card>
      )}

      {tier === 'pro' && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <p>Pro Features - Volles AI Arsenal verfügbar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
