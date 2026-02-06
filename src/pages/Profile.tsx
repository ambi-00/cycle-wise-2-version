import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { RankBadge } from "@/components/RankBadge";
import { getGamificationStats } from "@/lib/supabaseHelpers";

// Helper function to create cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("No 2d context");

  // Limit max size to 1024px for better performance and smaller file size
  const maxSize = 1024;
  let width = pixelCrop.width;
  let height = pixelCrop.height;

  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = (height / width) * maxSize;
      width = maxSize;
    } else {
      width = (width / height) * maxSize;
      height = maxSize;
    }
  }

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg", 0.85); // 85% quality for good compression
  });
};

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Preview states
  const [showPreview, setShowPreview] = useState(false);

  // Gamification stats
  const [gamificationStats, setGamificationStats] = useState<any>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Helper to ensure valid session before API calls
  const ensureValidSession = async () => {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error || !session) {
      await supabase.auth.signOut();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    return session;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      if (!session) {
        window.location.href = '/login';
        return;
      }

      const user = session.user;
      if (user) {
        const metadata = user.user_metadata as any;
        setEmail(user.email || "");
        setName(metadata?.name || "");
        setPhone(metadata?.phone || "");
        setAvatarUrl(metadata?.avatar_url || null);
        setTimezone(metadata?.timezone || "");
        setExperienceLevel(metadata?.experienceLevel || "");

        // Load gamification stats
        try {
          const stats = await getGamificationStats(user.id);
          setGamificationStats(stats);
        } catch (error) {
          console.error('Failed to load gamification stats:', error);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // If no timezone set in profile, default to browser timezone
  useEffect(() => {
    if (timezone) return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch (e) {
      // ignore
    }
  }, [timezone]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    
    setLoading(true);
    toast({ title: "Processing...", description: "Compressing and uploading image" });
    
    try {
      const session = await ensureValidSession();
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      
      const userId = session.user.id;
      if (!userId) throw new Error("Not authenticated");

      // Convert to data URL for immediate display
      const reader = new FileReader();
      const dataUrlPromise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
      const dataUrl = await dataUrlPromise;
      
      // Update UI immediately
      setAvatarUrl(dataUrl);
      setShowCropper(false);
      setImageToCrop(null);
      
      // Try to upload to bucket
      const filePath = `${userId}/avatar-${Date.now()}.jpg`;
      const { data: uploadData } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      let finalUrl = dataUrl;
      if (uploadData) {
        const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);
        finalUrl = (publicData as any)?.publicUrl || dataUrl;
      }
      
      // Update with final URL
      await supabase.auth.updateUser({ data: { avatar_url: finalUrl } });
      if (finalUrl !== dataUrl) setAvatarUrl(finalUrl);
      
      toast({ title: "Avatar saved", description: "Profile picture updated." });
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    toast({ title: "Saving...", description: "Updating your profile" });
    
    try {
      await ensureValidSession();
      
      const updateData: any = {
        data: { name, phone, timezone, experienceLevel }
      };
      if (password) updateData.password = password;

      const { error } = await supabase.auth.updateUser(updateData);
      if (error) throw error;

      toast({ title: "Profile saved", description: "Your profile was updated successfully." });
      setPassword("");
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (err: any) {
      console.error('saveProfile error:', err);
      toast({ title: "Save failed", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pb-24 pt-20 lg:pl-64 lg:pt-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-3xl p-4 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground lg:text-3xl">Your Profile</h1>
            <p className="mt-1 text-muted-foreground">Manage your account details</p>
          </div>
          {gamificationStats && (
            <RankBadge rank={gamificationStats.current_rank} size="lg" />
          )}
        </div>

        <Card className="rounded-2xl bg-card p-6 shadow-card">
          <CardHeader className="mb-4">
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar 
                className="h-24 w-24 cursor-pointer transition-transform hover:scale-105" 
                onClick={() => avatarUrl && setShowPreview(true)}
              >
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="avatar" />
                ) : (
                  <AvatarFallback className="text-xl">U</AvatarFallback>
                )}
              </Avatar>

              <div className="flex flex-col">
                <label className="text-sm text-muted-foreground">Profile Photo</label>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    id="avatar-input"
                    ref={(el) => (fileInputRef.current = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="px-4 py-2">
                    Choose file
                  </Button>

                  <span className="text-sm text-muted-foreground">PNG, JPG — wird automatisch komprimiert</span>
                </div>
                {avatarUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowPreview(true)}
                    className="mt-2 w-fit text-xs"
                  >
                    Click avatar to view full size
                  </Button>
                )}
              </div>
            </div>

            {/* Image Cropper Dialog */}
            <Dialog open={showCropper} onOpenChange={(open) => {
              setShowCropper(open);
              if (!open) {
                setImageToCrop(null);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
              }
            }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crop your photo</DialogTitle>
                  <DialogDescription>
                    Adjust the position and zoom to crop your photo
                  </DialogDescription>
                </DialogHeader>
                <div className="relative h-96 w-full">
                  {imageToCrop && (
                    <Cropper
                      image={imageToCrop}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium">Zoom</label>
                  <Slider
                    value={[zoom]}
                    onValueChange={(value) => setZoom(value[0])}
                    min={1}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <DialogFooter className="mt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setShowCropper(false);
                      setImageToCrop(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCropSave} disabled={loading}>
                    {loading ? "Saving..." : "Save Photo"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Image Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Profile Photo</DialogTitle>
                </DialogHeader>
                <div className="flex items-center justify-center p-4">
                  <img 
                    src={avatarUrl || ""} 
                    alt="Profile preview" 
                    className="max-h-[70vh] w-auto rounded-lg object-contain"
                  />
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowPreview(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div>
              <label className="text-sm font-medium text-foreground">Display Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="text-base text-foreground">{email}</span>
                <Button variant="outline" size="sm" onClick={() => setShowChangeEmail(true)}>Change email</Button>
              </div>
            </div>

            {/* Change Email Dialog */}
            <Dialog open={showChangeEmail} onOpenChange={setShowChangeEmail}>
              <DialogTrigger asChild><span /></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change email</DialogTitle>
                  <DialogDescription>Enter your new email address. You will receive a confirmation link.</DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-3">
                  <label className="text-sm">New email</label>
                  <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="mt-1" />
                </div>
                <DialogFooter>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setShowChangeEmail(false)}>Cancel</Button>
                    <Button
                      onClick={async () => {
                        if (!newEmail) {
                          toast({ title: "No email", description: "Please enter a new email address." });
                          return;
                        }
                        setLoading(true);
                        try {
                          const { error } = await supabase.auth.updateUser({ email: newEmail });
                          if (error) throw error;
                          toast({ title: "Email updated", description: "Check your new email for a confirmation link." });
                          setEmail(newEmail);
                          setShowChangeEmail(false);
                        } catch (err) {
                          const msg = err instanceof Error ? err.message : String(err);
                          toast({ title: "Change failed", description: msg });
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Change email
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">Timezone</label>
                <Select value={timezone} onValueChange={(val) => setTimezone(val)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="(Select timezone)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                    <SelectItem value="Europe/Berlin">Europe/Berlin (UTC+1)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (UTC-8)</SelectItem>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</SelectItem>
                    <SelectItem value="Asia/Shanghai">Asia/Shanghai (UTC+8)</SelectItem>
                    <SelectItem value="Australia/Sydney">Australia/Sydney (UTC+10)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Experience Level</label>
                <Select value={experienceLevel} onValueChange={(val) => setExperienceLevel(val)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="(Select level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="mt-2 flex items-center gap-3">
                <Button variant="outline" onClick={() => setShowChangePassword(true)}>Change password</Button>
                <p className="text-sm text-muted-foreground">Leave unchanged to keep current password.</p>
              </div>

              <Dialog open={showChangePassword} onOpenChange={(open) => setShowChangePassword(open)}>
                <DialogTrigger asChild>
                  <span />
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change password</DialogTitle>
                    <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
                  </DialogHeader>

                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-sm">Current password</label>
                      <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm">New password</label>
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm">Confirm new password</label>
                      <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" />
                    </div>
                  </div>

                  <DialogFooter>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setShowChangePassword(false)}>Cancel</Button>
                      <Button
                        onClick={async () => {
                          if (!email) {
                            toast({ title: "No email", description: "Email is required to re-authenticate." });
                            return;
                          }
                          if (!oldPassword || !newPassword || !confirmPassword) {
                            toast({ title: "Missing fields", description: "Please fill all password fields." });
                            return;
                          }
                          if (newPassword !== confirmPassword) {
                            toast({ title: "Mismatch", description: "New passwords do not match." });
                            return;
                          }
                          setLoading(true);
                          try {
                            // re-authenticate
                            const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: oldPassword });
                            if (signErr) throw signErr;

                            // update password
                            const { error: updErr } = await supabase.auth.updateUser({ password: newPassword });
                            if (updErr) throw updErr;

                            toast({ title: "Password updated", description: "Your password was changed." });
                            setOldPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                            setShowChangePassword(false);
                          } catch (err) {
                            console.error("Password change failed:", err);
                            const msg = err instanceof Error ? err.message : String(err);
                            toast({ title: "Change failed", description: msg });
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        Change password
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveProfile} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
