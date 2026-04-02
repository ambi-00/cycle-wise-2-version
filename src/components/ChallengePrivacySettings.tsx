import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Shield, Eye, EyeOff, Trophy, Users, Settings, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  privacy_level: 'private' | 'leaderboard' | 'public';
  anonymous_mode: boolean;
  share_strategies: boolean;
  share_stats: boolean;
  allow_follow: boolean;
}

export function ChallengePrivacySettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    privacy_level: 'private' as 'private' | 'leaderboard' | 'public',
    anonymous_mode: false,
    share_strategies: false,
    share_stats: false,
    allow_follow: false,
  });

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = (await supabase.auth.getSession()).data.session?.user ?? null;
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Type assertion since Supabase still returns enum as string
      const profileData = data as Profile;
      setProfile(profileData);
      setFormData({
        username: profileData.username || '',
        display_name: profileData.display_name || '',
        bio: profileData.bio || '',
        privacy_level: (profileData.privacy_level as 'private' | 'leaderboard' | 'public') || 'private',
        anonymous_mode: profileData.anonymous_mode || false,
        share_strategies: profileData.share_strategies || false,
        share_stats: profileData.share_stats || false,
        allow_follow: profileData.allow_follow || false,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const user = (await supabase.auth.getSession()).data.session?.user ?? null;
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username || null,
          display_name: formData.display_name || null,
          bio: formData.bio || null,
          privacy_level: formData.privacy_level,
          anonymous_mode: formData.anonymous_mode,
          share_strategies: formData.share_strategies,
          share_stats: formData.share_stats,
          allow_follow: formData.allow_follow,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Saved!',
        description: 'Your challenge settings have been updated.',
      });

      await loadProfile();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDisplayName = () => {
    if (!profile) return 'User';
    if (formData.anonymous_mode) return `Trader #${profile.id.slice(0, 6)}`;
    return formData.display_name || profile.name || 'User';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-card text-primary shadow-soft hover:shadow-md transition-shadow">
          <User className="h-5 w-5" />
          {formData.privacy_level !== 'private' && (
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent border border-background flex items-center justify-center">
              <Trophy className="h-2 w-2 text-white" />
            </div>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px]" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Challenge Profile
            </h3>
            <p className="text-sm text-muted-foreground">
              Control what other traders can see
            </p>
          </div>

          <Separator />

          {/* Privacy Level */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Visibility</Label>
            <RadioGroup
              value={formData.privacy_level}
              onValueChange={(value: any) =>
                setFormData({ ...formData, privacy_level: value })
              }
            >
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                <RadioGroupItem value="private" id="private" />
                <div className="flex-1">
                  <Label htmlFor="private" className="font-medium cursor-pointer flex items-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    Private
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Not on leaderboard. Only you see your stats.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                <RadioGroupItem value="leaderboard" id="leaderboard" />
                <div className="flex-1">
                  <Label htmlFor="leaderboard" className="font-medium cursor-pointer flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Leaderboard
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Visible in rankings. Aggregated stats only.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                <RadioGroupItem value="public" id="public" />
                <div className="flex-1">
                  <Label htmlFor="public" className="font-medium cursor-pointer flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Public
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Others can view your profile.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Public Profile Settings */}
          {formData.privacy_level !== 'private' && (
            <>
              <Separator />

              {/* Anonymous Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label>Anonymous</Label>
                  <p className="text-sm text-muted-foreground">
                    Show "Trader #{formData.username ? formData.username.slice(0, 6) : 'XXXX'}" instead of name
                  </p>
                </div>
                <Switch
                  checked={formData.anonymous_mode}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, anonymous_mode: checked })
                  }
                />
              </div>

              {!formData.anonymous_mode && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username (optional)</Label>
                  <Input
                    id="username"
                    placeholder="trader_name"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                  />
                </div>
              )}

              {formData.privacy_level === 'public' && !formData.anonymous_mode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      placeholder="Your Name"
                      value={formData.display_name}
                      onChange={(e) =>
                        setFormData({ ...formData, display_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio (optional)</Label>
                    <Textarea
                      id="bio"
                      placeholder="A few words about you..."
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                </>
              )}

              <Separator />

              {/* Share Settings */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Share</Label>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label>Detailed Stats</Label>
                    <p className="text-sm text-muted-foreground">
                      Win Rate, RRR, Consistency Score
                    </p>
                  </div>
                  <Switch
                    checked={formData.share_stats}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, share_stats: checked })
                    }
                  />
                </div>

                {formData.privacy_level === 'public' && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <Label>Strategies</Label>
                      <p className="text-sm text-muted-foreground">
                        Others can see your trading strategies
                      </p>
                    </div>
                    <Switch
                      checked={formData.share_strategies}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, share_strategies: checked })
                      }
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Save Button */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                loadProfile(); // Reset
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>

          {/* Privacy Notice */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              <Eye className="h-3 w-3 inline mr-1" />
              <strong>Privacy:</strong> Your absolute P&L, account size, cycle details and trade screenshots are NEVER shared.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
