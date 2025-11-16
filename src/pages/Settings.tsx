import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Loader2, User, Lock, Bell, Sparkles, CreditCard, Check } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserPlan } from "@/hooks/useUserPlan";
import { createCheckoutSession, openCustomerPortal, checkSubscription } from "@/lib/stripe";
import { toast } from "sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [chatInstances, setChatInstances] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast: toastFn } = useToast();
  const { plan, loading: planLoading, refetch: refetchPlan } = useUserPlan();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      await loadProfile(session.user.id);
      await loadChatInstances(session.user.id);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
        loadChatInstances(session.user.id);
        checkSubscription().catch(console.error);
        refetchPlan();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, refetchPlan]);

  const loadChatInstances = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_instances")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChatInstances(data || []);
    } catch (error) {
      console.error("Error loading chat instances:", error);
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
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

      toastFn({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      await loadProfile(user.id);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toastFn({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpgradeToPro = async () => {
    setIsUpgrading(true);
    try {
      await createCheckoutSession();
      toast.success("Redirecting to checkout...");
    } catch (error) {
      console.error("Error starting upgrade:", error);
      toast.error("Failed to start upgrade process");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error("Error opening billing portal:", error);
      toast.error("Failed to open billing management");
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

      toastFn({
        title: "Setting updated",
        description: checked 
          ? "Branding badge will be hidden on all your public chats"
          : "Branding badge will be shown on all your public chats",
      });
    } catch (error: any) {
      console.error("Error updating branding badge setting:", error);
      setHideBrandingBadge(!checked);
      toastFn({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toastFn({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toastFn({
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

      toastFn({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });

      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toastFn({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar
          mode="dashboard"
          selectedChatId={null}
          onChatSelect={() => {}}
          userEmail={user?.email}
          userPlan={plan}
          onUpgrade={handleUpgradeToPro}
          onLogout={handleLogout}
          canCreateMore={plan?.can_create_more_chats || false}
        />

        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="border-b bg-card sticky top-0 z-10">
            <div className="px-6 py-4">
              <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="px-6 py-8 max-w-4xl">
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
                                $9/month
                              </span>
                            )}
                          </div>
                          {plan.plan_type === 'free' ? (
                            <Button 
                              onClick={handleUpgradeToPro}
                              className="bg-primary hover:bg-primary-glow"
                              disabled={isUpgrading}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              {isUpgrading ? "Processing..." : "Upgrade to Pro"}
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleManageBilling}
                            >
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
                              <span>Quick start prompts</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>Webhook integration</span>
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
                              <span>Advanced analytics</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>Priority support</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>Hide branding badge</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>Custom domains</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>
                      Customize your experience and interface preferences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="hide-badge">Hide Branding Badge</Label>
                        <p className="text-sm text-muted-foreground">
                          Remove "Powered by Flowify" from your public chats
                        </p>
                        {!plan?.can_hide_branding && (
                          <Badge variant="secondary" className="mt-2">
                            Pro Feature
                          </Badge>
                        )}
                      </div>
                      <Switch
                        id="hide-badge"
                        checked={hideBrandingBadge}
                        onCheckedChange={handleToggleBrandingBadge}
                        disabled={!plan?.can_hide_branding}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
