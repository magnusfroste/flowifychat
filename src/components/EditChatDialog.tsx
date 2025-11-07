/**
 * View Component: Edit Chat Dialog
 * Simplified dialog wrapper using unified ChatConfigurationForm
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { isSlugAvailable, isReservedSlug } from "@/lib/slugUtils";
import { ChatConfigurationForm, type ChatFormValues } from "@/components/ChatConfigurationForm";

const formSchema = z.object({
  name: z.string().min(1, "Chat name is required"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  webhookUrl: z.string().url("Must be a valid URL").startsWith("https://", "Must use HTTPS"),
  welcomeMessage: z.string().min(1, "Welcome message is required"),
  chatTitle: z.string().min(1, "Chat title is required"),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color"),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color"),
  quickStartPrompts: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().min(1).max(100),
        enabled: z.boolean(),
      })
    )
    .max(5)
    .optional(),
  quickStartPromptsAutoSend: z.boolean().optional(),
  welcomeScreenEnabled: z.boolean().optional(),
  welcomeSubtitle: z.string().max(200).optional(),
  welcomeDisclaimer: z.string().max(300).optional(),
  inputPlaceholder: z.string().max(100).optional(),
  useLandingPageMode: z.boolean().optional(),
  
  // Landing Page Branding
  logoUrl: z.string().optional(),
  avatarUrl: z.string().optional(),
  landingTagline: z.string().max(200).optional(),
  backgroundStyle: z.enum(['solid', 'gradient', 'pattern']).optional(),
  backgroundGradientStart: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  backgroundGradientEnd: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  layoutStyle: z.enum(['centered', 'left-visual', 'compact']).optional(),
  fontFamily: z.string().optional(),
  
  // Message Appearance
  messageBubbleStyle: z.enum(['rounded', 'sharp', 'pill']).optional(),
  messageDensity: z.enum(['compact', 'comfortable', 'spacious']).optional(),
  showTimestamps: z.boolean().optional(),
  
  // Button & Input Styling
  buttonStyle: z.enum(['filled', 'outline', 'ghost']).optional(),
  inputStyle: z.enum(['outline', 'filled', 'underline']).optional(),
  borderRadius: z.number().min(0).max(20).optional(),
  
  // Advanced Colors
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  userMessageColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  botMessageColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  colorMode: z.enum(['light', 'dark', 'auto']).optional(),
});

interface EditChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  onChatCreated?: () => void;
}

export function EditChatDialog({ open, onOpenChange, chatId, onChatCreated }: EditChatDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      webhookUrl: "",
      welcomeMessage: "Hi! How can I help you today?",
      chatTitle: "Chat Assistant",
      primaryColor: "#3b82f6",
      accentColor: "#8b5cf6",
      quickStartPrompts: [],
      quickStartPromptsAutoSend: true,
      welcomeScreenEnabled: false,
      welcomeSubtitle: "",
      welcomeDisclaimer: "",
      inputPlaceholder: "",
      useLandingPageMode: true,
      
      // Landing Page Branding
      logoUrl: "",
      avatarUrl: "",
      landingTagline: "",
      backgroundStyle: "solid",
      backgroundGradientStart: "#3b82f6",
      backgroundGradientEnd: "#8b5cf6",
      backgroundColor: "#ffffff",
      layoutStyle: "centered",
      fontFamily: "Inter",
      
      // Message Appearance
      messageBubbleStyle: "rounded",
      messageDensity: "comfortable",
      showTimestamps: false,
      
      // Button & Input Styling
      buttonStyle: "filled",
      inputStyle: "outline",
      borderRadius: 8,
      
      // Advanced Colors
      secondaryColor: "#10b981",
      userMessageColor: "#3b82f6",
      botMessageColor: "#f3f4f6",
      colorMode: "light",
    },
  });

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugError(null);
      return;
    }

    setCheckingSlug(true);
    setSlugError(null);

    if (isReservedSlug(slug)) {
      setSlugError("This slug is reserved and cannot be used");
      setCheckingSlug(false);
      return;
    }

    const available = await isSlugAvailable(slug, chatId);
    if (!available) {
      setSlugError("This slug is already taken");
    }
    setCheckingSlug(false);
  };

  useEffect(() => {
    const fetchChatInstance = async () => {
      if (!open || !chatId) return;
      
      setFetching(true);
      try {
        const { data, error } = await supabase
          .from("chat_instances")
          .select("*")
          .eq("id", chatId)
          .single();

        if (error) throw error;

        const branding = data.custom_branding as any;
        form.reset({
          name: data.name,
          slug: data.slug || "",
          webhookUrl: data.webhook_url,
          welcomeMessage: branding.welcomeMessage,
          chatTitle: branding.chatTitle,
          primaryColor: branding.primaryColor,
          accentColor: branding.accentColor,
          quickStartPrompts: branding.quickStartPrompts || [],
          quickStartPromptsAutoSend: branding.quickStartPromptsAutoSend ?? true,
          welcomeScreenEnabled: branding.welcomeScreen?.enabled || false,
          welcomeSubtitle: branding.welcomeScreen?.subtitle || "",
          welcomeDisclaimer: branding.welcomeScreen?.disclaimer || "",
          inputPlaceholder: branding.inputPlaceholder || "",
          useLandingPageMode: branding.useLandingPageMode ?? true,
          
          // Landing Page Branding
          logoUrl: branding.logoUrl || "",
          avatarUrl: branding.avatarUrl || "",
          landingTagline: branding.landingTagline || "",
          backgroundStyle: branding.backgroundStyle || "solid",
          backgroundGradientStart: branding.backgroundGradientStart || "#3b82f6",
          backgroundGradientEnd: branding.backgroundGradientEnd || "#8b5cf6",
          backgroundColor: branding.backgroundColor || "#ffffff",
          layoutStyle: branding.layoutStyle || "centered",
          fontFamily: branding.fontFamily || "Inter",
          
          // Message Appearance
          messageBubbleStyle: branding.messageBubbleStyle || "rounded",
          messageDensity: branding.messageDensity || "comfortable",
          showTimestamps: branding.showTimestamps || false,
          
          // Button & Input Styling
          buttonStyle: branding.buttonStyle || "filled",
          inputStyle: branding.inputStyle || "outline",
          borderRadius: branding.borderRadius ?? 8,
          
          // Advanced Colors
          secondaryColor: branding.secondaryColor || "#10b981",
          userMessageColor: branding.userMessageColor || "#3b82f6",
          botMessageColor: branding.botMessageColor || "#f3f4f6",
          colorMode: branding.colorMode || "light",
        });
      } catch (error: any) {
        console.error("Error fetching chat instance:", error);
        toast({
          title: "Error",
          description: "Failed to load chat instance",
          variant: "destructive",
        });
        onOpenChange(false);
      } finally {
        setFetching(false);
      }
    };

    fetchChatInstance();
  }, [open, chatId, form, toast, onOpenChange]);

  const onSubmit = async (values: ChatFormValues) => {
    // Final slug check
    if (slugError) {
      toast({
        title: "Invalid Slug",
        description: slugError,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update a chat",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("chat_instances")
        .update({
          name: values.name,
          slug: values.slug,
          webhook_url: values.webhookUrl,
          custom_branding: {
            primaryColor: values.primaryColor,
            accentColor: values.accentColor,
            avatarUrl: values.avatarUrl || null,
            welcomeMessage: values.welcomeMessage,
            chatTitle: values.chatTitle,
            quickStartPrompts: values.quickStartPrompts || [],
            quickStartPromptsAutoSend: values.quickStartPromptsAutoSend ?? true,
            welcomeScreen: values.welcomeScreenEnabled
              ? {
                  enabled: true,
                  subtitle: values.welcomeSubtitle,
                  disclaimer: values.welcomeDisclaimer,
                }
              : { enabled: false },
            inputPlaceholder: values.inputPlaceholder || "Type your message...",
            inputSubmitLabel: "Send",
            useLandingPageMode: values.useLandingPageMode ?? true,
            metadata: {
              includeReferrer: true,
              includeUserAgent: true,
              customFields: {},
            },
            
            // Landing Page Branding
            logoUrl: values.logoUrl || "",
            landingTagline: values.landingTagline || "",
            backgroundStyle: values.backgroundStyle || "solid",
            backgroundGradientStart: values.backgroundGradientStart,
            backgroundGradientEnd: values.backgroundGradientEnd,
            backgroundColor: values.backgroundColor,
            layoutStyle: values.layoutStyle || "centered",
            fontFamily: values.fontFamily || "Inter",
            
            // Message Appearance
            messageBubbleStyle: values.messageBubbleStyle || "rounded",
            messageDensity: values.messageDensity || "comfortable",
            showTimestamps: values.showTimestamps || false,
            
            // Button & Input Styling
            buttonStyle: values.buttonStyle || "filled",
            inputStyle: values.inputStyle || "outline",
            borderRadius: values.borderRadius ?? 8,
            
            // Advanced Colors
            secondaryColor: values.secondaryColor,
            userMessageColor: values.userMessageColor,
            botMessageColor: values.botMessageColor,
            colorMode: values.colorMode || "light",
          } as any,
        })
        .eq("id", chatId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Chat instance updated successfully",
      });

      onOpenChange(false);
      if (onChatCreated) {
        onChatCreated();
      }
    } catch (error: any) {
      console.error("Error updating chat instance:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update chat instance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Chat Instance</DialogTitle>
          <DialogDescription>
            Update your chat configuration and branding settings.
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <ChatConfigurationForm
            mode="edit"
            form={form}
            onSubmit={onSubmit}
            loading={loading}
            checkingSlug={checkingSlug}
            slugError={slugError}
            onSlugChange={checkSlugAvailability}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
