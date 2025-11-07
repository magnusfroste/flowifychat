/**
 * View Component: Create Chat Dialog
 * Simplified dialog wrapper using unified ChatConfigurationForm
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Sparkles } from "lucide-react";
import { generateSlug, isSlugAvailable, isReservedSlug } from "@/lib/slugUtils";
import { ChatConfigurationForm, type ChatFormValues } from "@/components/ChatConfigurationForm";

const chatSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Chat name is required")
    .max(100, "Chat name must be less than 100 characters"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  webhookUrl: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .min(1, "Webhook URL is required")
    .max(500, "URL must be less than 500 characters")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "URL must start with http:// or https://"
    ),
  welcomeMessage: z
    .string()
    .trim()
    .min(1, "Welcome message is required")
    .max(500, "Welcome message must be less than 500 characters"),
  chatTitle: z
    .string()
    .trim()
    .min(1, "Chat title is required")
    .max(50, "Chat title must be less than 50 characters"),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  accentColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
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

interface CreateChatDialogProps {
  children?: React.ReactNode;
  onChatCreated?: () => void;
}

export const CreateChatDialog = ({ children, onChatCreated }: CreateChatDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
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

  // Auto-generate slug when name changes
  const handleNameChange = async (value: string) => {
    if (value) {
      const generatedSlug = generateSlug(value);
      form.setValue("slug", generatedSlug);
      await checkSlugAvailability(generatedSlug);
    }
  };

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

    const available = await isSlugAvailable(slug);
    if (!available) {
      setSlugError("This slug is already taken");
    }
    setCheckingSlug(false);
  };

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
        throw new Error("You must be logged in to create a chat instance");
      }

      const { data, error } = await supabase
        .from("chat_instances")
        .insert([{
          user_id: user.id,
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
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your chat interface has been created.",
      });

      setOpen(false);
      form.reset();
      
      if (onChatCreated) {
        onChatCreated();
      }
      
      // Redirect to the chat page
      navigate(`/chat/${data.id}`);
    } catch (error: any) {
      console.error("Error creating chat instance:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create chat instance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="lg" className="bg-primary hover:bg-primary-glow shadow-glow">
            <Plus className="mr-2 h-5 w-5" />
            Create New Chat Interface
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Chat Interface
          </DialogTitle>
          <DialogDescription>
            Configure your new chat interface for your n8n workflow
          </DialogDescription>
        </DialogHeader>

        <ChatConfigurationForm
          mode="create"
          form={form}
          onSubmit={onSubmit}
          loading={loading}
          checkingSlug={checkingSlug}
          slugError={slugError}
          onSlugChange={checkSlugAvailability}
          onNameChange={handleNameChange}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
