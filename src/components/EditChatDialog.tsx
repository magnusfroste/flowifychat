import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Link as LinkIcon, Copy, Check } from "lucide-react";
import { generateSlug, isSlugAvailable, isReservedSlug, getShareableUrl } from "@/lib/slugUtils";
import { QuickStartPromptsEditor } from "@/components/QuickStartPromptsEditor";
import { ImageUpload } from "@/components/ImageUpload";
import { BrandingTemplates, type BrandingTemplate } from "@/components/BrandingTemplates";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { QuickStartPrompt } from "@/lib/chatConfig";

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

type FormValues = z.infer<typeof formSchema>;

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
  const [copied, setCopied] = useState(false);

  const handleApplyTemplate = (template: BrandingTemplate) => {
    Object.entries(template.values).forEach(([key, value]) => {
      form.setValue(key as any, value);
    });
    toast({
      title: "Template Applied",
      description: `${template.name} branding has been applied`,
    });
  };

  const form = useForm<FormValues>({
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

  const handleCopyLink = () => {
    const slug = form.getValues("slug");
    if (slug) {
      navigator.clipboard.writeText(getShareableUrl(slug));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard",
      });
    }
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

  const onSubmit = async (values: FormValues) => {
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
          },
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <BrandingTemplates onApplyTemplate={handleApplyTemplate} />
              
              <div className="border-t my-4" />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chat Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Chat Bot" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Slug with Copy Button */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Share Link Slug</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., my-chat"
                            {...field}
                            onChange={async (e) => {
                              field.onChange(e);
                              await checkSlugAvailability(e.target.value);
                            }}
                            className={`bg-background font-mono ${
                              slugError ? "border-destructive" : ""
                            }`}
                          />
                          {checkingSlug && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                        </div>
                        {field.value && !slugError && !checkingSlug && (
                          <div className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                            <LinkIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="flex-1 text-xs font-mono text-muted-foreground truncate">
                              {getShareableUrl(field.value)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={handleCopyLink}
                            >
                              {copied ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                        {slugError && (
                          <p className="text-sm text-destructive">{slugError}</p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N8N Webhook URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-n8n-instance.com/webhook/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chatTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chat Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Chat Assistant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="welcomeMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Welcome Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Hi! How can I help you today?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input type="color" className="w-12 h-10 p-1" {...field} />
                          <Input type="text" placeholder="#3b82f6" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accentColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accent Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input type="color" className="w-12 h-10 p-1" {...field} />
                          <Input type="text" placeholder="#8b5cf6" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Quick Start Prompts */}
              <Collapsible className="border rounded-lg p-4 space-y-4">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="font-medium">Quick Start Prompts (Optional)</h3>
                    <p className="text-sm text-muted-foreground">
                      Suggested messages to help users get started
                    </p>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="quickStartPromptsAutoSend"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                        <div className="space-y-0.5">
                          <FormLabel>Auto-send on Click</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Send prompts immediately when clicked (otherwise just populates input)
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quickStartPrompts"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <QuickStartPromptsEditor
                            prompts={(field.value as QuickStartPrompt[]) || []}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Entry Experience Configuration */}
              <Collapsible className="border rounded-lg p-4 space-y-4">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="font-medium">Entry Experience</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose how users first interact with your chat
                    </p>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="useLandingPageMode"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                        <div className="space-y-0.5">
                          <FormLabel>Landing Page Mode</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Show centered input field (like Claude/ChatGPT) instead of full chat interface
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {!form.watch("useLandingPageMode") && (
                    <p className="text-xs text-muted-foreground px-3">
                      When disabled, users will see the full chat interface immediately or the welcome screen if enabled below.
                    </p>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Welcome Screen Configuration */}
              <Collapsible className="border rounded-lg p-4 space-y-4">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="font-medium">Welcome Screen (Optional)</h3>
                    <p className="text-sm text-muted-foreground">
                      Show a welcome screen before chat starts
                    </p>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="welcomeScreenEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Enable Welcome Screen</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {form.watch("welcomeScreenEnabled") && (
                    <>
                      <FormField
                        control={form.control}
                        name="welcomeSubtitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subtitle</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Get instant answers to your questions"
                                {...field}
                                className="bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="welcomeDisclaimer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Disclaimer (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="This bot is powered by AI. Responses may vary."
                                {...field}
                                className="bg-background resize-none"
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Input Customization */}
              <Collapsible className="border rounded-lg p-4 space-y-4">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="font-medium">Input Customization (Optional)</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize the chat input field
                    </p>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <FormField
                    control={form.control}
                    name="inputPlaceholder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Input Placeholder</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Type your message..."
                            {...field}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Landing Page Branding */}
              <Collapsible className="border rounded-lg p-4 space-y-4" defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="font-medium">🎨 Landing Page Branding</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize your chat's landing page appearance
                    </p>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUpload
                            bucket="chat-logos"
                            currentImageUrl={field.value}
                            onImageUploaded={field.onChange}
                            label="Logo"
                            maxSizeMB={5}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUpload
                            bucket="chat-avatars"
                            currentImageUrl={field.value}
                            onImageUploaded={field.onChange}
                            label="Bot Avatar"
                            maxSizeMB={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landingTagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Landing Page Tagline</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ready when you are"
                            {...field}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Appears below the title on the landing page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="backgroundStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Background Style</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select background style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="solid">Solid Color</SelectItem>
                            <SelectItem value="gradient">Gradient</SelectItem>
                            <SelectItem value="pattern">Subtle Pattern</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("backgroundStyle") === "solid" && (
                    <FormField
                      control={form.control}
                      name="backgroundColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Background Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input type="color" className="w-12 h-10 p-1" {...field} />
                              <Input type="text" placeholder="#ffffff" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("backgroundStyle") === "gradient" && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="backgroundGradientStart"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gradient Start</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input type="color" className="w-12 h-10 p-1" {...field} />
                                <Input type="text" placeholder="#3b82f6" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="backgroundGradientEnd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gradient End</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input type="color" className="w-12 h-10 p-1" {...field} />
                                <Input type="text" placeholder="#8b5cf6" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="layoutStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Layout Style</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select layout" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="centered">Centered</SelectItem>
                            <SelectItem value="left-visual">Left-Aligned with Visual</SelectItem>
                            <SelectItem value="compact">Compact</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fontFamily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Font Family</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select font" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                            <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Message Appearance */}
              <Collapsible className="border rounded-lg p-4 space-y-4">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="font-medium">💬 Message Appearance</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize how messages look
                    </p>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="messageBubbleStyle"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Message Bubble Style</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="rounded" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Rounded (Default)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="sharp" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Sharp Corners
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="pill" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Pill-shaped
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="messageDensity"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Message Density</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="compact" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Compact
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="comfortable" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Comfortable (Default)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="spacious" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Spacious
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showTimestamps"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                        <div className="space-y-0.5">
                          <FormLabel>Show Timestamps</FormLabel>
                          <FormDescription className="text-xs">
                            Display time for each message
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Button & Input Styling */}
              <Collapsible className="border rounded-lg p-4 space-y-4">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="font-medium">🎯 Button & Input Styling</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize buttons and input fields
                    </p>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="buttonStyle"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Button Style</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="filled" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Filled (Default)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="outline" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Outline
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="ghost" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Ghost
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inputStyle"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Input Field Style</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="outline" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Outline (Default)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="filled" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Filled
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="underline" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Underline Only
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="borderRadius"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Border Radius: {field.value}px</FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={20}
                            step={1}
                            value={[field.value || 8]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="py-4"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Controls roundness of buttons, inputs, and message bubbles
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Advanced Colors */}
              <Collapsible className="border rounded-lg p-4 space-y-4">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="font-medium">🌈 Advanced Colors</h3>
                    <p className="text-sm text-muted-foreground">
                      Fine-tune your color scheme
                    </p>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="secondaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Color</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" className="w-12 h-10 p-1" {...field} />
                            <Input type="text" placeholder="#10b981" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Used for success states and highlights
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userMessageColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Message Color</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" className="w-12 h-10 p-1" {...field} />
                            <Input type="text" placeholder="#3b82f6" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Background color for user messages
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="botMessageColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bot Message Color</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" className="w-12 h-10 p-1" {...field} />
                            <Input type="text" placeholder="#f3f4f6" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Background color for bot messages
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="colorMode"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Color Mode</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="light" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Light Mode
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="dark" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Dark Mode
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="auto" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Auto (Match System)
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>

              <div className="flex justify-end gap-2 pt-4 pb-2 sticky bottom-0 bg-background border-t mt-6 -mx-6 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Chat
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
