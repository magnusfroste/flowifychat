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
import { Loader2, Plus, Sparkles } from "lucide-react";

const chatSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Chat name is required")
    .max(100, "Chat name must be less than 100 characters"),
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
});

type ChatFormValues = z.infer<typeof chatSchema>;

interface CreateChatDialogProps {
  children?: React.ReactNode;
  onChatCreated?: () => void;
}

export const CreateChatDialog = ({ children, onChatCreated }: CreateChatDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
    defaultValues: {
      name: "",
      webhookUrl: "",
      welcomeMessage: "Hi! How can I help you today?",
      chatTitle: "Chat Assistant",
      primaryColor: "#3b82f6",
      accentColor: "#8b5cf6",
    },
  });

  const onSubmit = async (values: ChatFormValues) => {
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
          webhook_url: values.webhookUrl,
          custom_branding: {
            primaryColor: values.primaryColor,
            accentColor: values.accentColor,
            avatarUrl: null,
            welcomeMessage: values.welcomeMessage,
            chatTitle: values.chatTitle,
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

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
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
