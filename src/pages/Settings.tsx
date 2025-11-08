import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, User, Lock, Bell, Sparkles, CreditCard, Check } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserPlan } from "@/hooks/useUserPlan";
import flowifyLogo from "@/assets/logo-concept-1-flowing-bubble.png";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  hide_branding_badge: boolean;
}

const Settings = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [hideBrandingBadge, setHideBrandingBadge] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plan, loading: planLoading } = useUserPlan();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      await loadProfile(session.user.id);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create profile if it doesn't exist
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: userId, display_name: user?.email?.split('@')[0] || "" })
          .select()
          .single();

        if (insertError) throw insertError;
        
        setProfile(newProfile);
        setDisplayName(newProfile.display_name || "");
      } else {
        setProfile(data);
        setDisplayName(data.display_name || "");
        setHideBrandingBadge(data.hide_branding_badge || false);
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      await loadProfile(user.id);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBrandingBadge = async (checked: boolean) => {
    if (!user || !plan?.can_hide_branding) return;

    setHideBrandingBadge(checked);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ hide_branding_badge: checked })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Setting updated",
        description: checked 
          ? "Branding badge will be hidden on all your public chats"
          : "Branding badge will be shown on all your public chats",
      });
    } catch (error: any) {
      console.error("Error updating branding badge setting:", error);
      setHideBrandingBadge(!checked); // Revert on error
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <img src={flowifyLogo} alt="Flowify" className="h-8 w-8" />
                <span className="text-xl font-bold">Flowify</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="plans">
              <CreditCard className="h-4 w-4 mr-2" />
              Plans & Billing
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Bell className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information and how others see you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                  </div>

                  <Separator />

                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters long
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <Separator />

                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans">
            <Card>
              <CardHeader>
                <CardTitle>Plans & Billing</CardTitle>
                <CardDescription>
                  Manage your subscription and view usage statistics.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan */}
                <div>
                  <h3 className="font-semibold mb-3">Current Plan</h3>
                  {planLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading plan details...
                    </div>
                  ) : plan ? (
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={plan.plan_type === 'free' ? 'secondary' : 'default'}
                          className={plan.plan_type !== 'free' ? 'bg-primary/20 text-primary border-primary/30 text-base px-3 py-1' : 'text-base px-3 py-1'}
                        >
                          {plan.plan_type === 'free' ? 'Free Plan' : plan.plan_type === 'pro' ? 'Pro Plan' : 'Enterprise Plan'}
                        </Badge>
                        {plan.plan_type === 'pro' && (
                          <span className="text-sm text-muted-foreground">
                            $19/month
                          </span>
                        )}
                      </div>
                      {plan.plan_type === 'free' ? (
                        <Button 
                          onClick={() => navigate('/pricing')}
                          className="bg-primary hover:bg-primary-glow"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Upgrade to Pro
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          Manage Billing
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>

                <Separator />

                {/* Usage Statistics */}
                <div>
                  <h3 className="font-semibold mb-3">Usage Statistics</h3>
                  {!planLoading && plan ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                        <span className="text-sm">Chat Instances</span>
                        <span className="font-semibold">
                          {plan.current_chat_count} / {plan.plan_type === 'free' ? plan.max_chat_instances : '∞'}
                        </span>
                      </div>
                      {plan.plan_type === 'free' && (
                        <p className="text-xs text-muted-foreground">
                          {plan.can_create_more_chats 
                            ? `You can create ${plan.max_chat_instances - plan.current_chat_count} more chat instance${plan.max_chat_instances - plan.current_chat_count !== 1 ? 's' : ''}.`
                            : 'You have reached your chat instance limit. Upgrade to Pro for unlimited instances.'
                          }
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>

                <Separator />

                {/* Plan Features */}
                <div>
                  <h3 className="font-semibold mb-3">
                    {plan?.plan_type === 'free' ? 'Included in Your Plan' : 'Your Pro Features'}
                  </h3>
                  <ul className="space-y-2">
                    {plan?.plan_type === 'free' ? (
                      <>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>1 chat instance</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Custom branding (colors, logo, messages)</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Basic analytics & conversation history</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Unlimited chat instances</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Hide branding badge (white-label)</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Advanced analytics & export</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Priority support</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {plan?.plan_type === 'free' && (
                  <>
                    <Separator />
                    <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold">Upgrade to Pro</h4>
                      <p className="text-sm text-muted-foreground">
                        Get unlimited chat instances and remove Flowify branding for just $19/month.
                      </p>
                      <Button 
                        onClick={() => navigate('/pricing')}
                        className="w-full bg-primary hover:bg-primary-glow"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        View Pricing Plans
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Account Preferences</CardTitle>
                <CardDescription>
                  Customize your experience and notification settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-xs text-muted-foreground">
                      Choose your preferred color theme
                    </p>
                  </div>
                  <ThemeToggle />
                </div>

                <Separator />

                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Label>Hide Branding Badge</Label>
                      {!planLoading && !plan?.can_hide_branding && (
                        <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                          Pro
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Remove "Powered by Flowify" from all your public chat pages
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Switch 
                      checked={hideBrandingBadge} 
                      onCheckedChange={handleToggleBrandingBadge}
                      disabled={!plan?.can_hide_branding}
                    />
                    {!planLoading && !plan?.can_hide_branding && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => navigate('/pricing')}
                      >
                        <Sparkles className="mr-1 h-3 w-3" />
                        Upgrade
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;