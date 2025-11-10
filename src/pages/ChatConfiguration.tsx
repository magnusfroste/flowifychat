/**
 * Page: Chat Configuration (Create/Edit)
 * Full-page editor with persistent sidebar, tabs, and live preview
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, X, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ChatConfigurationTabs } from "@/components/ChatConfigurationTabs";
import { ChatConfigurationPreview } from "@/components/ChatConfigurationPreview";
import { BrandingTemplate } from "@/components/BrandingTemplates";
import { generateSlug } from "@/lib/slugUtils";
import type { ChatFormValues } from "@/types/chatConfiguration";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useUserPlan } from "@/hooks/useUserPlan";
import { createCheckoutSession } from "@/lib/stripe";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Reserved slugs
const RESERVED_SLUGS = ['auth', 'dashboard', 'chat', 'api', 'admin', 'new', 'edit'];

const formSchema = z.object({
  name: z.string().min(1, "Chat name is required"),
  slug: z.string().min(1, "Slug is required"),
  webhookUrl: z.string().optional().refine(
    (val) => !val || val === '' || z.string().url().safeParse(val).success,
    { message: "Must be a valid URL or leave empty" }
  ),
  welcomeMessage: z.string().optional(),
  chatTitle: z.string().min(1, "Chat title is required"),
  primaryColor: z.string(),
  accentColor: z.string(),
  quickStartPrompts: z.any().optional(),
  quickStartPromptsAutoSend: z.boolean().optional(),
  welcomeScreenEnabled: z.boolean().optional(),
  welcomeSubtitle: z.string().optional(),
  welcomeDisclaimer: z.string().optional(),
  inputPlaceholder: z.string().optional(),
  useLandingPageMode: z.boolean().optional(),
  logoUrl: z.string().optional(),
  avatarUrl: z.string().optional(),
  landingTagline: z.string().optional(),
  backgroundStyle: z.enum(['solid', 'gradient', 'pattern']).optional(),
  backgroundGradientStart: z.string().optional(),
  backgroundGradientEnd: z.string().optional(),
  backgroundColor: z.string().optional(),
  layoutStyle: z.enum(['centered', 'left-visual', 'compact']).optional(),
  fontFamily: z.string().optional(),
  messageBubbleStyle: z.enum(['rounded', 'sharp', 'pill']).optional(),
  messageDensity: z.enum(['compact', 'comfortable', 'spacious']).optional(),
  showTimestamps: z.enum(['always', 'never', 'hover']).optional(),
  buttonStyle: z.enum(['filled', 'outline', 'ghost']).optional(),
  inputStyle: z.enum(['outline', 'filled', 'underline']).optional(),
  borderRadius: z.number().optional(),
  secondaryColor: z.string().optional(),
  userMessageColor: z.string().optional(),
  botMessageColor: z.string().optional(),
  colorMode: z.enum(['light', 'dark', 'auto']).optional(),
  messageAlignment: z.enum(['left', 'center', 'full-width']).optional(),
  maxMessageWidth: z.number().optional(),
  showAvatars: z.boolean().optional(),
  avatarSize: z.enum(['small', 'medium', 'large']).optional(),
  avatarPosition: z.enum(['top', 'center']).optional(),
  showSidebar: z.boolean().optional(),
  allowAnonymousHistory: z.boolean().optional(),
  headerStyle: z.enum(['standard', 'minimal', 'prominent']).optional(),
  inputPosition: z.enum(['sticky-bottom', 'floating']).optional(),
  inputSize: z.enum(['compact', 'comfortable', 'large']).optional(),
  sendButtonStyle: z.enum(['icon', 'text', 'icon-text']).optional(),
  messageSpacing: z.enum(['tight', 'normal', 'relaxed']).optional(),
  animationSpeed: z.enum(['slow', 'normal', 'fast']).optional(),
  messageActions: z.enum(['inline', 'hover', 'menu']).optional(),
  showCopyButton: z.boolean().optional(),
  showRegenerateButton: z.boolean().optional(),
});

interface ChatConfigurationProps {
  mode: 'create' | 'edit';
}

export default function ChatConfiguration({ mode }: ChatConfigurationProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [chatInstances, setChatInstances] = useState<any[]>([]);
  const { plan } = useUserPlan();

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      webhookUrl: "",
      welcomeMessage: "",
      chatTitle: "",
      primaryColor: "#6366f1",
      accentColor: "#8b5cf6",
      secondaryColor: "#64748b",
      quickStartPrompts: [
        { id: 'prompt-1', text: 'Tell me a story', enabled: true },
        { id: 'prompt-2', text: 'Help me brainstorm', enabled: true },
        { id: 'prompt-3', text: 'Explain a concept', enabled: true },
      ],
      quickStartPromptsAutoSend: false,
      welcomeScreenEnabled: false,
      inputPlaceholder: "Type your message...",
      useLandingPageMode: true,
      backgroundStyle: 'solid',
      backgroundColor: "#ffffff",
      layoutStyle: 'centered',
      fontFamily: 'Inter',
      messageBubbleStyle: 'rounded',
      messageDensity: 'comfortable',
      showTimestamps: 'hover',
      buttonStyle: 'filled',
      inputStyle: 'outline',
      borderRadius: 8,
      userMessageColor: "#6366f1",
      botMessageColor: "#f1f5f9",
      colorMode: 'light',
      messageAlignment: 'left',
      maxMessageWidth: 800,
      showAvatars: true,
      avatarSize: 'medium',
      avatarPosition: 'center',
      showSidebar: true,
      allowAnonymousHistory: true,
      headerStyle: 'standard',
      inputPosition: 'sticky-bottom',
      inputSize: 'comfortable',
      sendButtonStyle: 'icon',
      messageSpacing: 'normal',
      animationSpeed: 'normal',
      messageActions: 'inline',
      showCopyButton: true,
      showRegenerateButton: true,
    },
  });

  // Check authentication and load chat instances
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadChatInstances(session.user.id);
    };
    checkAuth();
  }, [navigate]);

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

  // Fetch existing chat data in edit mode
  useEffect(() => {
    if (mode === 'edit' && id) {
      loadChatData();
    }
  }, [mode, id]);

  const loadChatData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_instances")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        const branding: any = data.custom_branding || {};
        form.reset({
          name: data.name,
          slug: data.slug,
          webhookUrl: data.webhook_url || "",
          welcomeMessage: branding.welcomeMessage || "",
          chatTitle: branding.chatTitle || data.name,
          primaryColor: branding.primaryColor || "#6366f1",
          accentColor: branding.accentColor || "#8b5cf6",
          secondaryColor: branding.secondaryColor || "#64748b",
          quickStartPrompts: branding.quickStartPrompts || [],
          quickStartPromptsAutoSend: branding.quickStartPromptsAutoSend || false,
          welcomeScreenEnabled: branding.welcomeScreenEnabled || false,
          welcomeSubtitle: branding.welcomeSubtitle || "",
          welcomeDisclaimer: branding.welcomeDisclaimer || "",
          inputPlaceholder: branding.inputPlaceholder || "Type your message...",
          useLandingPageMode: branding.useLandingPageMode !== false,
          logoUrl: branding.logoUrl || "",
          avatarUrl: branding.avatarUrl || "",
          landingTagline: branding.landingTagline || "",
          backgroundStyle: branding.backgroundStyle || 'solid',
          backgroundGradientStart: branding.backgroundGradientStart || "",
          backgroundGradientEnd: branding.backgroundGradientEnd || "",
          backgroundColor: branding.backgroundColor || "#ffffff",
          layoutStyle: branding.layoutStyle || 'centered',
          fontFamily: branding.fontFamily || 'Inter',
          messageBubbleStyle: branding.messageBubbleStyle || 'rounded',
          messageDensity: branding.messageDensity || 'comfortable',
          showTimestamps: branding.showTimestamps || 'hover',
          buttonStyle: branding.buttonStyle || 'filled',
          inputStyle: branding.inputStyle || 'outline',
          borderRadius: branding.borderRadius ?? 8,
          userMessageColor: branding.userMessageColor || "#6366f1",
          botMessageColor: branding.botMessageColor || "#f1f5f9",
          colorMode: branding.colorMode || 'light',
          messageAlignment: branding.messageAlignment || 'left',
          maxMessageWidth: branding.maxMessageWidth || 800,
          showAvatars: branding.showAvatars ?? true,
          avatarSize: branding.avatarSize || 'medium',
          avatarPosition: branding.avatarPosition || 'center',
          showSidebar: branding.showSidebar ?? true,
          allowAnonymousHistory: branding.allowAnonymousHistory ?? true,
          headerStyle: branding.headerStyle || 'standard',
          inputPosition: branding.inputPosition || 'sticky-bottom',
          inputSize: branding.inputSize || 'comfortable',
          sendButtonStyle: branding.sendButtonStyle || 'icon',
          messageSpacing: branding.messageSpacing || 'normal',
          animationSpeed: branding.animationSpeed || 'normal',
          messageActions: branding.messageActions || 'inline',
          showCopyButton: branding.showCopyButton ?? true,
          showRegenerateButton: branding.showRegenerateButton ?? true,
        });
      }
    } catch (error: any) {
      console.error("Error loading chat:", error);
      toast({
        title: "Error",
        description: "Failed to load chat configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    if (!slug) return false;
    
    if (RESERVED_SLUGS.includes(slug.toLowerCase())) {
      setSlugError("This slug is reserved");
      return false;
    }

    setCheckingSlug(true);
    setSlugError(null);

    try {
      const { data, error } = await supabase
        .from("chat_instances")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;

      // If editing, allow current slug
      if (mode === 'edit' && id && data?.id === id) {
        return true;
      }

      if (data) {
        setSlugError("This slug is already taken");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking slug:", error);
      setSlugError("Error checking slug availability");
      return false;
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleSlugChange = async (slug: string) => {
    await checkSlugAvailability(slug);
  };

  const handleNameChange = (name: string) => {
    const currentSlug = form.getValues("slug");
    if (!currentSlug || mode === 'create') {
      const newSlug = generateSlug(name);
      form.setValue("slug", newSlug);
      handleSlugChange(newSlug);
    }
  };

  const handleTemplateApply = (template: BrandingTemplate) => {
    Object.entries(template.values).forEach(([key, value]) => {
      form.setValue(key as any, value);
    });
    
    if (mode === 'create') {
      const currentName = form.getValues("name");
      if (!currentName) {
        const templateName = `${template.name} Chat`;
        form.setValue("name", templateName);
        
        const newSlug = generateSlug(templateName);
        form.setValue("slug", newSlug);
        handleSlugChange(newSlug);
      }
      
      const currentChatTitle = form.getValues("chatTitle");
      if (!currentChatTitle) {
        form.setValue("chatTitle", template.name);
      }
    }
    
    toast({
      title: "Template applied",
      description: `${template.name} template has been applied`,
    });
  };

  const onSubmit = async (values: ChatFormValues) => {
    const slugAvailable = await checkSlugAvailability(values.slug);
    if (!slugAvailable) {
      toast({
        title: "Invalid slug",
        description: slugError || "Please choose a different slug",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const customBranding: any = {
        chatTitle: values.chatTitle,
        welcomeMessage: values.welcomeMessage,
        primaryColor: values.primaryColor,
        accentColor: values.accentColor,
        secondaryColor: values.secondaryColor,
        quickStartPrompts: values.quickStartPrompts,
        quickStartPromptsAutoSend: values.quickStartPromptsAutoSend,
        welcomeScreenEnabled: values.welcomeScreenEnabled,
        welcomeSubtitle: values.welcomeSubtitle,
        welcomeDisclaimer: values.welcomeDisclaimer,
        inputPlaceholder: values.inputPlaceholder,
        useLandingPageMode: values.useLandingPageMode,
        logoUrl: values.logoUrl,
        avatarUrl: values.avatarUrl,
        landingTagline: values.landingTagline,
        backgroundStyle: values.backgroundStyle,
        backgroundGradientStart: values.backgroundGradientStart,
        backgroundGradientEnd: values.backgroundGradientEnd,
        backgroundColor: values.backgroundColor,
        layoutStyle: values.layoutStyle,
        fontFamily: values.fontFamily,
        messageBubbleStyle: values.messageBubbleStyle,
        messageDensity: values.messageDensity,
        showTimestamps: values.showTimestamps,
        buttonStyle: values.buttonStyle,
        inputStyle: values.inputStyle,
        borderRadius: values.borderRadius,
        userMessageColor: values.userMessageColor,
        botMessageColor: values.botMessageColor,
        colorMode: values.colorMode,
        messageAlignment: values.messageAlignment,
        maxMessageWidth: values.maxMessageWidth,
        showAvatars: values.showAvatars,
        avatarSize: values.avatarSize,
        avatarPosition: values.avatarPosition,
        showSidebar: values.showSidebar,
        allowAnonymousHistory: values.allowAnonymousHistory,
        headerStyle: values.headerStyle,
        inputPosition: values.inputPosition,
        inputSize: values.inputSize,
        sendButtonStyle: values.sendButtonStyle,
        messageSpacing: values.messageSpacing,
        animationSpeed: values.animationSpeed,
        messageActions: values.messageActions,
        showCopyButton: values.showCopyButton,
        showRegenerateButton: values.showRegenerateButton,
      };

      if (mode === 'create') {
        const { error } = await supabase.from("chat_instances").insert({
          user_id: session.user.id,
          name: values.name,
          slug: values.slug,
          webhook_url: values.webhookUrl || null,
          custom_branding: customBranding,
        });

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Chat interface created successfully",
        });
        navigate("/dashboard");
      } else if (mode === 'edit' && id) {
        const { error } = await supabase
          .from("chat_instances")
          .update({
            name: values.name,
            slug: values.slug,
            webhook_url: values.webhookUrl || null,
            custom_branding: customBranding,
          })
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Saved!",
          description: "Changes saved successfully",
        });
      }
    } catch (error: any) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save chat configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  const handleUpgrade = async () => {
    try {
      await createCheckoutSession();
    } catch (error) {
      console.error("Upgrade error:", error);
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
        <DashboardSidebar
          chatInstances={chatInstances}
          selectedChatId={id || null}
          onSelectChat={() => {}}
          onCreateNew={() => navigate("/chat/new")}
          userEmail={user?.email}
          userPlan={plan}
          onUpgrade={handleUpgrade}
          onLogout={handleLogout}
          canCreateMore={plan?.can_create_more_chats || false}
          currentChatId={id}
        />

        <SidebarInset className="flex-1">
          {/* Header with Breadcrumb */}
          <header className="border-b bg-card sticky top-0 z-10">
            <div className="px-6 py-4">
              <Breadcrumb className="mb-2">
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden sm:block">
                    <BreadcrumbLink
                      onClick={() => navigate("/dashboard")}
                      className="cursor-pointer"
                    >
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden sm:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      onClick={() => navigate("/dashboard")}
                      className="cursor-pointer"
                    >
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {form.watch('name') || 'New Chat'}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-2xl font-bold">
                {mode === 'create' ? 'Create Chat Interface' : 'Edit Chat Interface'}
              </h1>
            </div>
          </header>

          {/* Main Content - Split View */}
          <div className="px-6 py-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
                  {/* Left Panel - Tabs */}
                  <div className="w-1/2 overflow-y-auto pr-4 pb-24">
                    <ChatConfigurationTabs
                      form={form}
                      mode={mode}
                      onTemplateApply={handleTemplateApply}
                      isSlugChecking={checkingSlug}
                      slugError={slugError}
                      onSlugChange={handleSlugChange}
                      onNameChange={handleNameChange}
                    />
                  </div>

                  {/* Right Panel - Live Preview */}
                  <div className="w-1/2 sticky top-24 h-[calc(100vh-12rem)]">
              <ChatConfigurationPreview 
                formValues={form.watch()} 
                useLandingPageMode={form.watch('useLandingPageMode')}
              />
                  </div>
                </div>

                {/* Sticky Footer with Actions */}
                <div className="fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur-sm z-20">
                  <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {mode === 'edit' ? 'Edit your chat configuration' : 'Create a new chat interface'}
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saving || checkingSlug}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {mode === 'create' ? 'Create Chat' : 'Save Changes'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
