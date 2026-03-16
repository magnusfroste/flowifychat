/**
 * Component: Chat Configuration Tabs
 * Tabbed interface for organizing form fields into logical sections
 */

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Loader2, Link as LinkIcon, Copy, Check, Palette, MessageSquare, Zap, Settings, Lock, Globe, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QuickStartPromptsEditor } from "@/components/QuickStartPromptsEditor";
import { ImageUpload } from "@/components/ImageUpload";
import { BrandingTemplates, type BrandingTemplate } from "@/components/BrandingTemplates";
import { getShareableUrl } from "@/lib/slugUtils";
import { useToast } from "@/hooks/use-toast";
import type { ChatFormValues } from "@/types/chatConfiguration";

interface ChatConfigurationTabsProps {
  form: UseFormReturn<ChatFormValues>;
  mode: 'create' | 'edit';
  onTemplateApply: (template: BrandingTemplate) => void;
  isSlugChecking: boolean;
  slugError: string | null;
  onSlugChange: (slug: string) => void;
  onNameChange: (name: string) => void;
  defaultTab?: 'chat' | 'design' | 'settings';
}

export function ChatConfigurationTabs({
  form,
  mode,
  onTemplateApply,
  isSlugChecking,
  slugError,
  onSlugChange,
  onNameChange,
  defaultTab = 'chat',
}: ChatConfigurationTabsProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = () => {
    const slug = form.getValues("slug");
    const url = getShareableUrl(slug);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast({
      title: "Link copied!",
      description: "Shareable link copied to clipboard",
    });
  };

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="chat" className="text-xs">
          💬 Chat
        </TabsTrigger>
        <TabsTrigger value="design" className="text-xs">
          🎨 Design
        </TabsTrigger>
        <TabsTrigger value="settings" className="text-xs">
          ⚙️ Settings
        </TabsTrigger>
      </TabsList>

      {/* TAB 1: CHAT EXPERIENCE */}
      <TabsContent value="chat" className="space-y-6">
        {/* Landing Page Mode */}
        <FormField
          control={form.control}
          name="useLandingPageMode"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Landing Page Mode</FormLabel>
                <FormDescription>Show centered input before first message</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
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
                <Input {...field} placeholder="Welcome to Support" />
              </FormControl>
              <FormDescription>Displayed as the main heading</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Landing Tagline - Only visible when Landing Page Mode is enabled */}
        {form.watch("useLandingPageMode") && (
          <FormField
            control={form.control}
            name="landingTagline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Landing Tagline</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ready when you are." />
                </FormControl>
                <FormDescription>Subtitle displayed on the landing page</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Input Placeholder */}
        <FormField
          control={form.control}
          name="inputPlaceholder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Input Placeholder</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Type your message..." />
              </FormControl>
              <FormDescription>Text shown in the input field</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quick Start Prompts */}
        <FormField
          control={form.control}
          name="quickStartPrompts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quick Start Prompts</FormLabel>
              <FormControl>
                <QuickStartPromptsEditor
                  prompts={field.value || []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>Suggested prompts for users to click</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Auto-send Toggle */}
        <FormField
          control={form.control}
          name="quickStartPromptsAutoSend"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Auto-send Quick Prompts</FormLabel>
                <FormDescription>Send prompt immediately when clicked</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
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
                  {...field} 
                  placeholder="How can I help you today?" 
                  rows={3}
                  disabled={form.watch('useLandingPageMode')}
                />
              </FormControl>
              <FormDescription>
                {form.watch('useLandingPageMode') 
                  ? 'First message users see (disable landing to edit)'
                  : 'First message users see'
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Enable Welcome Screen */}
        <FormField
          control={form.control}
          name="welcomeScreenEnabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Enable Welcome Screen</FormLabel>
                <FormDescription>
                  {form.watch('useLandingPageMode')
                    ? 'Not shown with landing page mode (disable landing to edit)'
                    : 'Show welcome message before chat starts'
                  }
                </FormDescription>
              </div>
              <FormControl>
                <Switch 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                  disabled={form.watch('useLandingPageMode')}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Welcome Subtitle & Disclaimer - Only visible when welcome screen is enabled */}
        {form.watch("welcomeScreenEnabled") && !form.watch("useLandingPageMode") && (
          <>
            <FormField
              control={form.control}
              name="welcomeSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Welcome Subtitle</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="How can we help you today?" />
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
                  <FormLabel>Welcome Disclaimer</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="By using this chat..." rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </TabsContent>

      {/* TAB 2: DESIGN */}
      <TabsContent value="design" className="space-y-6">
        {/* Templates */}
        <div>
          <BrandingTemplates onApplyTemplate={onTemplateApply} />
        </div>
        {/* Message Bubble Style */}
        <FormField
          control={form.control}
          name="messageBubbleStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message Bubble Style</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rounded" id="rounded" />
                    <label htmlFor="rounded" className="text-sm cursor-pointer">Rounded</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sharp" id="sharp" />
                    <label htmlFor="sharp" className="text-sm cursor-pointer">Sharp</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pill" id="pill" />
                    <label htmlFor="pill" className="text-sm cursor-pointer">Pill</label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Message Density */}
        <FormField
          control={form.control}
          name="messageDensity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message Density</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />


        {/* User & Bot Message Colors */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="userMessageColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Message Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input type="color" {...field} className="w-16 h-10 p-1" />
                    <Input {...field} placeholder="#6366f1" className="flex-1" />
                  </div>
                </FormControl>
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
                    <Input type="color" {...field} className="w-16 h-10 p-1" />
                    <Input {...field} placeholder="#f1f5f9" className="flex-1" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Button Style */}
        <FormField
          control={form.control}
          name="buttonStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Button Style</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="filled" id="filled" />
                    <label htmlFor="filled" className="text-sm cursor-pointer">Filled</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outline" id="outline" />
                    <label htmlFor="outline" className="text-sm cursor-pointer">Outline</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ghost" id="ghost" />
                    <label htmlFor="ghost" className="text-sm cursor-pointer">Ghost</label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Input Style */}
        <FormField
          control={form.control}
          name="inputStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Input Style</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outline" id="input-outline" />
                    <label htmlFor="input-outline" className="text-sm cursor-pointer">Outline</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="filled" id="input-filled" />
                    <label htmlFor="input-filled" className="text-sm cursor-pointer">Filled</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="underline" id="input-underline" />
                    <label htmlFor="input-underline" className="text-sm cursor-pointer">Underline</label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Border Radius */}
        <FormField
          control={form.control}
          name="borderRadius"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Border Radius: {field.value}px</FormLabel>
              <FormControl>
                <Slider
                  value={[field.value || 8]}
                  onValueChange={(value) => field.onChange(value[0])}
                  min={0}
                  max={24}
                  step={1}
                  className="w-full"
                />
              </FormControl>
              <FormDescription>Roundness of buttons and inputs</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Primary, Accent & Secondary Colors */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="primaryColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input type="color" {...field} className="w-16 h-10 p-1" />
                    <Input {...field} placeholder="#6366f1" className="flex-1" />
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
                    <Input type="color" {...field} className="w-16 h-10 p-1" />
                    <Input {...field} placeholder="#8b5cf6" className="flex-1" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="secondaryColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secondary Color</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input type="color" {...field} className="w-16 h-10 p-1" />
                  <Input {...field} placeholder="#64748b" className="flex-1" />
                </div>
              </FormControl>
              <FormDescription>Used for accents and secondary UI elements</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Logo Upload */}
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <FormControl>
                <ImageUpload
                  currentImageUrl={field.value || ""}
                  onImageUploaded={field.onChange}
                  bucket="chat-logos"
                  label="Upload Logo"
                />
              </FormControl>
              <FormDescription>Displayed at the top of the chat</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Avatar Upload */}
        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bot Avatar</FormLabel>
              <FormControl>
                <ImageUpload
                  currentImageUrl={field.value || ""}
                  onImageUploaded={field.onChange}
                  bucket="chat-avatars"
                  label="Upload Avatar"
                />
              </FormControl>
              <FormDescription>Bot's profile picture in messages</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Background Style */}
        <FormField
          control={form.control}
          name="backgroundStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Background Style</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solid" id="solid" />
                    <label htmlFor="solid" className="text-sm cursor-pointer">Solid</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gradient" id="gradient" />
                    <label htmlFor="gradient" className="text-sm cursor-pointer">Gradient</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pattern" id="pattern" />
                    <label htmlFor="pattern" className="text-sm cursor-pointer">Pattern</label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Background Colors */}
        {form.watch("backgroundStyle") === "solid" && (
          <FormField
            control={form.control}
            name="backgroundColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Background Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input type="color" {...field} className="w-16 h-10 p-1" />
                    <Input {...field} placeholder="#ffffff" className="flex-1" />
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
                      <Input type="color" {...field} className="w-16 h-10 p-1" />
                      <Input {...field} placeholder="#fdf4ff" className="flex-1" />
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
                      <Input type="color" {...field} className="w-16 h-10 p-1" />
                      <Input {...field} placeholder="#fef3c7" className="flex-1" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Layout Style */}
        <FormField
          control={form.control}
          name="layoutStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Layout Style</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="centered">Centered</SelectItem>
                  <SelectItem value="left-visual">Left Visual</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Font Family */}
        <FormField
          control={form.control}
          name="fontFamily"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Font Family</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

      </TabsContent>

      {/* TAB 3: SETTINGS */}
      <TabsContent value="settings" className="space-y-6">
        {/* Chat Type Selector */}
        <div className="rounded-lg border p-4 bg-muted/30">
          <FormField
            control={form.control}
            name="chatType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">Chat Type</FormLabel>
                <FormDescription className="mb-4">
                  Choose how users interact with this chat interface
                </FormDescription>
                <FormControl>
                  <RadioGroup 
                    value={field.value} 
                    onValueChange={field.onChange} 
                    className="grid gap-3"
                  >
                    <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="authenticated" id="authenticated" className="mt-1" />
                      <div className="flex-1">
                        <label htmlFor="authenticated" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                          <Lock className="h-4 w-4" />
                          Authenticated Chat
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Requires login • Saves conversation history • Session management • Analytics tracking
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="public" id="public" className="mt-1" />
                      <div className="flex-1">
                        <label htmlFor="public" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                          <Globe className="h-4 w-4" />
                          Public Chat
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          No login required • Stateless • GDPR-compliant • Direct webhook only
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch('chatType') === 'public' && (
            <Alert className="mt-4 border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                <strong>Public Mode:</strong> No conversation history or user data is stored. Messages are sent directly to your webhook. No session tracking or analytics available.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Chat Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chat Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="My Support Chat"
                  onChange={(e) => {
                    field.onChange(e);
                    onNameChange(e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>Internal name for this chat interface</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Share Link Slug */}
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Share Link</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <div className="relative flex-1">
                    <Input
                      {...field}
                      placeholder="my-chat"
                      onChange={(e) => {
                        field.onChange(e);
                        onSlugChange(e.target.value);
                      }}
                    />
                    {isSlugChecking && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </FormControl>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 border rounded-md hover:bg-muted transition-colors"
                >
                  {copiedLink ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              {field.value && !slugError && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <LinkIcon className="h-3 w-3" />
                  <span className="font-mono text-xs">{getShareableUrl(field.value)}</span>
                </div>
              )}
              {slugError && <p className="text-sm text-destructive mt-2">{slugError}</p>}
              <FormDescription>Unique URL for sharing this chat</FormDescription>
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
              <FormLabel>n8n Webhook URL (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://your-n8n-instance.com/webhook/..." />
              </FormControl>
              <FormDescription>Send chat messages to your n8n workflow</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* n8n Authentication Section */}
        <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
          <FormField
            control={form.control}
            name="n8nAuthEnabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <FormLabel>Enable n8n Authentication</FormLabel>
                  <FormDescription>
                    Secure your n8n webhook with basic auth
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

          {form.watch('n8nAuthEnabled') && (
            <>
              <FormField
                control={form.control}
                name="n8nAuthUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="admin" />
                    </FormControl>
                    <FormDescription>Basic auth username</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="n8nAuthPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="••••••••" />
                    </FormControl>
                    <FormDescription>Basic auth password</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        {/* Layout Section */}
        <div className="space-y-4 pt-6 border-t">
          <div>
            <h3 className="font-medium text-lg mb-1">📐 Layout</h3>
            <p className="text-sm text-muted-foreground">Sidebar and conversation history settings</p>
          </div>

          <FormField
            control={form.control}
            name="showSidebar"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Show Sidebar</FormLabel>
                  <FormDescription>
                    Display a sidebar with conversation history
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

          <FormField
            control={form.control}
            name="allowAnonymousHistory"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Anonymous History</FormLabel>
                  <FormDescription>
                    Allow non-logged-in users to see their local chat history
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

          <FormField
            control={form.control}
            name="analyticsEnabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>📊 Analytics Tracking</FormLabel>
                  <FormDescription>
                    Track anonymous page views and message counts (GDPR-safe)
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
        </div>

        {/* Interactive Elements Section */}
        <div className="space-y-4 pt-6 border-t">
          <div>
            <h3 className="font-medium text-lg mb-1">🎮 Interactive Elements</h3>
            <p className="text-sm text-muted-foreground">Action buttons and user interactions</p>
          </div>

          {/* Message Actions Style */}
          <FormField
            control={form.control}
            name="messageActions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message Actions Style</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="inline">Always Visible</SelectItem>
                    <SelectItem value="hover">Show on Hover</SelectItem>
                    <SelectItem value="menu">Menu Button</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>How message action buttons appear</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Show Timestamps */}
          <FormField
            control={form.control}
            name="showTimestamps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Show Timestamps</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="always">Always</SelectItem>
                    <SelectItem value="hover">On Hover</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>When to display message timestamps</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Show Copy Button */}
          <FormField
            control={form.control}
            name="showCopyButton"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                <div className="space-y-0.5">
                  <FormLabel>Show Copy Button</FormLabel>
                  <FormDescription>Allow users to copy messages</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Show Regenerate Button */}
          <FormField
            control={form.control}
            name="showRegenerateButton"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                <div className="space-y-0.5">
                  <FormLabel>Show Regenerate Button</FormLabel>
                  <FormDescription>Allow users to regenerate responses</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
