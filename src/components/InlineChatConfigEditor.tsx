/**
 * Inline Chat Configuration Editor
 * Renders the chat config form + preview inside the admin layout
 */

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ChatConfigurationTabs } from "@/components/ChatConfigurationTabs";
import { BrandingTemplate } from "@/components/BrandingTemplates";
import { generateSlug } from "@/lib/slugUtils";
import type { ChatFormValues } from "@/types/chatConfiguration";
import type { AdminActiveView } from "@/types/adminLayout";

const RESERVED_SLUGS = ['auth', 'dashboard', 'chat', 'api', 'admin', 'new', 'edit'];

const formSchema = z.object({
  name: z.string().min(1, "Chat name is required"),
  slug: z.string().min(1, "Slug is required"),
  webhookUrl: z.string().optional().refine(
    (val) => {
      if (!val || val === '') return true;
      const parsed = z.string().url().safeParse(val);
      if (!parsed.success) return false;
      if (!val.startsWith('https://')) return false;
      if (val.length > 2048) return false;
      return true;
    },
    { message: "Must be a valid HTTPS URL (max 2048 characters)" }
  ),
  chatType: z.enum(['public', 'authenticated']).optional().default('authenticated'),
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
  showBotAvatar: z.boolean().optional(),
  showUserAvatar: z.boolean().optional(),
  showUserBubble: z.boolean().optional(),
  userAvatarStyle: z.enum(['circle', 'rounded', 'none']).optional(),
  avatarSize: z.enum(['small', 'medium', 'large']).optional(),
  avatarPosition: z.enum(['top', 'center']).optional(),
  showSidebar: z.boolean().optional(),
  allowAnonymousHistory: z.boolean().optional(),
  analyticsEnabled: z.boolean().optional(),
  headerStyle: z.enum(['standard', 'minimal', 'prominent']).optional(),
  inputPosition: z.enum(['sticky-bottom', 'floating']).optional(),
  inputSize: z.enum(['compact', 'comfortable', 'large']).optional(),
  sendButtonStyle: z.enum(['icon', 'text', 'icon-text']).optional(),
  showAttachmentButton: z.boolean().optional(),
  showVoiceButton: z.boolean().optional(),
  messageSpacing: z.enum(['tight', 'normal', 'relaxed']).optional(),
  animationSpeed: z.enum(['slow', 'normal', 'fast']).optional(),
  messageActions: z.enum(['inline', 'hover', 'menu', 'openai-row']).optional(),
  showCopyButton: z.boolean().optional(),
  showRegenerateButton: z.boolean().optional(),
  showThumbsButtons: z.boolean().optional(),
  showShareButton: z.boolean().optional(),
  textColor: z.string().optional(),
  fontWeight: z.enum(['light', 'normal', 'medium', 'semibold', 'bold']).optional(),
  lineHeight: z.enum(['tight', 'normal', 'relaxed', 'loose']).optional(),
  letterSpacing: z.enum(['tight', 'normal', 'wide']).optional(),
  n8nAuthEnabled: z.boolean().optional(),
  n8nAuthUsername: z.string().optional(),
  n8nAuthPassword: z.string().optional(),
});

interface InlineChatConfigEditorProps {
  chatInstanceId: string;
  activeView: AdminActiveView; // 'design' or 'settings'
  onSaved?: () => void;
}

export function InlineChatConfigEditor({ chatInstanceId, activeView, onSaved }: InlineChatConfigEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", slug: "", webhookUrl: "", welcomeMessage: "",
      chatTitle: "", primaryColor: "#6366f1", accentColor: "#8b5cf6",
      secondaryColor: "#64748b", quickStartPrompts: [], quickStartPromptsAutoSend: false,
      welcomeScreenEnabled: false, inputPlaceholder: "Type your message...",
      useLandingPageMode: true, backgroundStyle: 'solid', backgroundColor: "#ffffff",
      layoutStyle: 'centered', fontFamily: 'Inter', messageBubbleStyle: 'rounded',
      messageDensity: 'comfortable', showTimestamps: 'hover', buttonStyle: 'filled',
      inputStyle: 'outline', borderRadius: 8, userMessageColor: "#6366f1",
      botMessageColor: "#f1f5f9", messageAlignment: 'left', maxMessageWidth: 800,
      showAvatars: true, avatarSize: 'medium', avatarPosition: 'center',
      showSidebar: true, allowAnonymousHistory: true, headerStyle: 'standard',
      inputPosition: 'sticky-bottom', inputSize: 'comfortable', sendButtonStyle: 'icon',
      messageSpacing: 'normal', animationSpeed: 'normal', messageActions: 'inline',
      showCopyButton: true, showRegenerateButton: true, chatType: 'authenticated',
    },
  });

  const loadChatData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_instances")
        .select("*")
        .eq("id", chatInstanceId)
        .single();

      if (error) throw error;
      if (!data) return;

      const branding: any = data.custom_branding || {};
      form.reset({
        name: data.name,
        slug: data.slug,
        webhookUrl: data.webhook_url || "",
        chatType: (data as any).chat_type || 'authenticated',
        n8nAuthEnabled: data.n8n_auth_enabled || false,
        n8nAuthUsername: data.n8n_auth_username || "",
        n8nAuthPassword: data.n8n_auth_password || "",
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
    } catch (error: any) {
      console.error("Error loading chat:", error);
      toast({ title: "Error", description: "Failed to load chat configuration", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [chatInstanceId, form, toast]);

  useEffect(() => { loadChatData(); }, [loadChatData]);

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
        .from("chat_instances").select("id").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (data?.id === chatInstanceId) return true;
      if (data) { setSlugError("This slug is already taken"); return false; }
      return true;
    } catch { setSlugError("Error checking slug"); return false; }
    finally { setCheckingSlug(false); }
  };

  const handleSlugChange = async (slug: string) => { await checkSlugAvailability(slug); };

  const handleNameChange = (name: string) => {
    const currentSlug = form.getValues("slug");
    if (!currentSlug) {
      const newSlug = generateSlug(name);
      form.setValue("slug", newSlug);
      handleSlugChange(newSlug);
    }
  };

  const handleTemplateApply = (template: BrandingTemplate) => {
    Object.entries(template.values).forEach(([key, value]) => {
      form.setValue(key as any, value);
    });
    toast({ title: "Template applied", description: `${template.name} template has been applied` });
  };

  const onSubmit = async (values: ChatFormValues) => {
    const slugAvailable = await checkSlugAvailability(values.slug);
    if (!slugAvailable) {
      toast({ title: "Invalid slug", description: slugError || "Please choose a different slug", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const customBranding: any = {
        chatTitle: values.chatTitle, welcomeMessage: values.welcomeMessage,
        primaryColor: values.primaryColor, accentColor: values.accentColor,
        secondaryColor: values.secondaryColor, quickStartPrompts: values.quickStartPrompts,
        quickStartPromptsAutoSend: values.quickStartPromptsAutoSend,
        welcomeScreenEnabled: values.welcomeScreenEnabled,
        welcomeSubtitle: values.welcomeSubtitle, welcomeDisclaimer: values.welcomeDisclaimer,
        inputPlaceholder: values.inputPlaceholder, useLandingPageMode: values.useLandingPageMode,
        logoUrl: values.logoUrl, avatarUrl: values.avatarUrl, landingTagline: values.landingTagline,
        backgroundStyle: values.backgroundStyle, backgroundGradientStart: values.backgroundGradientStart,
        backgroundGradientEnd: values.backgroundGradientEnd, backgroundColor: values.backgroundColor,
        layoutStyle: values.layoutStyle, fontFamily: values.fontFamily,
        messageBubbleStyle: values.messageBubbleStyle, messageDensity: values.messageDensity,
        showTimestamps: values.showTimestamps, buttonStyle: values.buttonStyle,
        inputStyle: values.inputStyle, borderRadius: values.borderRadius,
        userMessageColor: values.userMessageColor, botMessageColor: values.botMessageColor,
        colorMode: values.colorMode, messageAlignment: values.messageAlignment,
        maxMessageWidth: values.maxMessageWidth, showAvatars: values.showAvatars,
        showBotAvatar: values.showBotAvatar, showUserAvatar: values.showUserAvatar,
        showUserBubble: values.showUserBubble, userAvatarStyle: values.userAvatarStyle,
        avatarSize: values.avatarSize, avatarPosition: values.avatarPosition,
        showSidebar: values.showSidebar, allowAnonymousHistory: values.allowAnonymousHistory,
        headerStyle: values.headerStyle, inputPosition: values.inputPosition,
        inputSize: values.inputSize, sendButtonStyle: values.sendButtonStyle,
        showAttachmentButton: values.showAttachmentButton, showVoiceButton: values.showVoiceButton,
        messageSpacing: values.messageSpacing, animationSpeed: values.animationSpeed,
        messageActions: values.messageActions, showCopyButton: values.showCopyButton,
        showRegenerateButton: values.showRegenerateButton,
        showThumbsButtons: values.showThumbsButtons, showShareButton: values.showShareButton,
        textColor: values.textColor, fontWeight: values.fontWeight,
        lineHeight: values.lineHeight, letterSpacing: values.letterSpacing,
      };

      const { error } = await supabase
        .from("chat_instances")
        .update({
          name: values.name, slug: values.slug,
          chat_type: values.chatType || 'authenticated',
          webhook_url: values.webhookUrl || null,
          n8n_auth_enabled: values.n8nAuthEnabled || false,
          n8n_auth_username: values.n8nAuthUsername || null,
          n8n_auth_password: values.n8nAuthPassword || null,
          custom_branding: customBranding,
        })
        .eq("id", chatInstanceId);

      if (error) throw error;
      toast({ title: "Saved!", description: "Changes saved successfully" });
      onSaved?.();
    } catch (error: any) {
      console.error("Error saving:", error);
      toast({ title: "Error", description: error.message || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Map activeView to the corresponding tab in ChatConfigurationTabs
  const defaultTab = activeView === 'design' ? 'design' : activeView === 'settings' ? 'settings' : 'chat';
  const viewLabel = activeView === 'design' ? 'Design' : activeView === 'settings' ? 'Settings' : 'Chat';

  return (
    <div className="h-full flex flex-col">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          {/* Sticky save bar */}
          <div className="border-b bg-card px-6 py-3 flex items-center justify-between shrink-0">
            <h2 className="text-sm font-semibold text-foreground">
              {showDesign ? 'Design' : 'Settings'}
            </h2>
            <Button type="submit" size="sm" disabled={saving || checkingSlug}>
              {saving ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving...</>
              ) : (
                <><Save className="mr-2 h-3.5 w-3.5" />Save Changes</>
              )}
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ChatConfigurationTabs
              form={form}
              mode="edit"
              onTemplateApply={handleTemplateApply}
              isSlugChecking={checkingSlug}
              slugError={slugError}
              onSlugChange={handleSlugChange}
              onNameChange={handleNameChange}
              defaultTab={showDesign ? 'design' : 'settings'}
            />
          </div>
        </form>
      </Form>
    </div>
  );
}
