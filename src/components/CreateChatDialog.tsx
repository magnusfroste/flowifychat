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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Sparkles, Link as LinkIcon } from "lucide-react";
import { generateSlug, isSlugAvailable, isReservedSlug, getShareableUrl } from "@/lib/slugUtils";
import { QuickStartPromptsEditor } from "@/components/QuickStartPromptsEditor";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import type { QuickStartPrompt } from "@/lib/chatConfig";

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
});

type ChatFormValues = z.infer<typeof chatSchema>;

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
    },
  });

  // Auto-generate slug when name changes
  const handleNameChange = async (value: string) => {
    form.setValue("name", value);
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
        .insert({
          user_id: user.id,
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
            useLandingPageMode: values.useLandingPageMode ?? true,
            metadata: {
              includeReferrer: true,
              includeUserAgent: true,
              customFields: {},
            },
          },
          is_active: true,
        })
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Chat Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chat Instance Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Customer Support Bot"
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormDescription>
                    Internal name to identify this chat instance
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
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
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          <LinkIcon className="h-3 w-3" />
                          <span className="font-mono">{getShareableUrl(field.value)}</span>
                        </div>
                      )}
                      {slugError && (
                        <p className="text-sm text-destructive">{slugError}</p>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Your public chat link (lowercase, numbers, hyphens only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Webhook URL */}
            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>n8n Webhook URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://your-n8n-instance.com/webhook/..."
                      {...field}
                      className="bg-background font-mono text-sm"
                    />
                  </FormControl>
                  <FormDescription>
                    Your n8n webhook endpoint that will handle chat messages
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Chat Title */}
            <FormField
              control={form.control}
              name="chatTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chat Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Chat Assistant"
                      {...field}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormDescription>
                    Title shown at the top of the chat interface
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Welcome Message */}
            <FormField
              control={form.control}
              name="welcomeMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Welcome Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hi! How can I help you today?"
                      {...field}
                      className="bg-background resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    First message users see when they open the chat
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          {...field}
                          className="h-10 w-20 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="#3b82f6"
                          className="bg-background font-mono"
                        />
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
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          {...field}
                          className="h-10 w-20 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="#8b5cf6"
                          className="bg-background font-mono"
                        />
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

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background border-t mt-6 -mx-6 px-6 py-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-glow"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Chat
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
