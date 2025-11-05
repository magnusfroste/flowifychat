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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, Copy, Check } from "lucide-react";
import { generateSlug, isSlugAvailable, isReservedSlug, getShareableUrl } from "@/lib/slugUtils";
import { QuickStartPromptsEditor } from "@/components/QuickStartPromptsEditor";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
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
            avatarUrl: null,
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
            metadata: {
              includeReferrer: true,
              includeUserAgent: true,
              customFields: {},
            },
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
