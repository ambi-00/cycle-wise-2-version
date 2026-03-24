import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Edit2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'premium' | 'pro';
  status: string;
  email: string;
  fullName: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodEnd: string;
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<Subscription | null>(null);
  const [newTier, setNewTier] = useState<'free' | 'premium' | 'pro'>('free');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filtered = subscriptions.filter(sub => 
      sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.userId.includes(searchQuery)
    );
    setFilteredSubscriptions(filtered);
  }, [searchQuery, subscriptions]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/subscriptions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      setFilteredSubscriptions(data.subscriptions || []);
      
      toast({
        title: 'Success',
        description: `Loaded ${data.count} subscriptions`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch subscriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTier = async () => {
    if (!selectedUser) return;

    try {
      setIsUpdating(true);
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.userId,
          tier: newTier,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      toast({
        title: 'Success',
        description: `Updated ${selectedUser.email} to ${newTier} tier`,
      });

      // Update local state
      setSubscriptions(subscriptions.map(sub => 
        sub.userId === selectedUser.userId 
          ? { ...sub, tier: newTier }
          : sub
      ));
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update subscription',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'premium':
        return 'bg-blue-100 text-blue-800';
      case 'pro':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Admin: Subscriptions</h1>
          <p className="text-muted-foreground">View and manage user subscriptions</p>
        </motion.div>

        {/* Search & Refresh */}
        <div className="mb-6 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, name, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={fetchSubscriptions}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Subscriptions</CardTitle>
            <CardDescription>
              {filteredSubscriptions.length} users found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No subscriptions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Tier</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Period End</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.map((sub) => (
                      <motion.tr
                        key={sub.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b hover:bg-accent/50"
                      >
                        <td className="py-3 px-4">{sub.email}</td>
                        <td className="py-3 px-4">{sub.fullName}</td>
                        <td className="py-3 px-4">
                          <Badge className={getTierColor(sub.tier)}>
                            {sub.tier}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(sub.status)}>
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(sub);
                              setNewTier(sub.tier);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Update Tier Dialog */}
      <AlertDialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Update Subscription Tier</AlertDialogTitle>
          <AlertDialogDescription>
            Change tier for {selectedUser?.email}
          </AlertDialogDescription>

          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Current Tier: {selectedUser?.tier}</label>
              <Select value={newTier} onValueChange={(value) => setNewTier(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateTier}
              disabled={isUpdating || newTier === selectedUser?.tier}
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
