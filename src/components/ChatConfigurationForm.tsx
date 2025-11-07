/**
 * Model+View: Unified Chat Configuration Form
 * Shared form component used by both Create and Edit dialogs
 * Implements progressive disclosure with Templates First approach
 */

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Loader2, Link as LinkIcon, Copy, Check, ChevronDown } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { QuickStartPromptsEditor } from "@/components/QuickStartPromptsEditor";
import { ImageUpload } from "@/components/ImageUpload";
import { BrandingTemplates, type BrandingTemplate } from "@/components/BrandingTemplates";
import { getShareableUrl } from "@/lib/slugUtils";
import { useToast } from "@/hooks/use-toast";
import type { QuickStartPrompt } from "@/lib/chatConfig";

export interface ChatFormValues {
  name: string;
  slug: string;
  webhookUrl: string;
  welcomeMessage: string;
  chatTitle: string;
  primaryColor: string;
  accentColor: string;
  quickStartPrompts?: QuickStartPrompt[];
  quickStartPromptsAutoSend?: boolean;
  welcomeScreenEnabled?: boolean;
  welcomeSubtitle?: string;
  welcomeDisclaimer?: string;
  inputPlaceholder?: string;
  useLandingPageMode?: boolean;
  
  // Landing Page Branding
  logoUrl?: string;
  avatarUrl?: string;
  landingTagline?: string;
  backgroundStyle?: 'solid' | 'gradient' | 'pattern';
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundColor?: string;
  layoutStyle?: 'centered' | 'left-visual' | 'compact';
  fontFamily?: string;
  
  // Message Appearance
  messageBubbleStyle?: 'rounded' | 'sharp' | 'pill';
  messageDensity?: 'compact' | 'comfortable' | 'spacious';
  showTimestamps?: boolean;
  
  // Button & Input Styling
  buttonStyle?: 'filled' | 'outline' | 'ghost';
  inputStyle?: 'outline' | 'filled' | 'underline';
  borderRadius?: number;
  
  // Advanced Colors
  secondaryColor?: string;
  userMessageColor?: string;
  botMessageColor?: string;
  colorMode?: 'light' | 'dark' | 'auto';
}

interface ChatConfigurationFormProps {
  mode: 'create' | 'edit';
  form: UseFormReturn<ChatFormValues>;
  onSubmit: (values: ChatFormValues) => Promise<void>;
  loading: boolean;
  checkingSlug: boolean;
  slugError: string | null;
  onSlugChange: (slug: string) => Promise<void>;
  onNameChange?: (name: string) => void;
  onCancel: () => void;
}

export function ChatConfigurationForm({
  mode,
  form,
  onSubmit,
  loading,
  checkingSlug,
  slugError,
  onSlugChange,
  onNameChange,
  onCancel,
}: ChatConfigurationFormProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [landingBrandingOpen, setLandingBrandingOpen] = useState(mode === 'edit');
  const [messagesAppearanceOpen, setMessagesAppearanceOpen] = useState(false);
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const [buttonInputOpen, setButtonInputOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleApplyTemplate = (template: BrandingTemplate) => {
    Object.entries(template.values).forEach(([key, value]) => {
      form.setValue(key as any, value);
    });
    toast({
      title: "Template Applied",
      description: `${template.name} branding has been applied`,
    });
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Templates First */}
        <BrandingTemplates onApplyTemplate={handleApplyTemplate} />
        
        <div className="border-t" />

        {/* Always Visible: Basic Settings */}
        <div className="space-y-4">
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
                    onChange={(e) => {
                      field.onChange(e);
                      onNameChange?.(e.target.value);
                    }}
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
                          await onSlugChange(e.target.value);
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
                        {mode === 'edit' && (
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
                        )}
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
        </div>

        {/* Collapsible Section 1: Landing Page & Branding */}
        <Collapsible open={landingBrandingOpen} onOpenChange={setLandingBrandingOpen} className="border rounded-lg">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="text-left">
              <h3 className="font-medium flex items-center gap-2">
                🎨 Landing Page & Branding
              </h3>
              <p className="text-sm text-muted-foreground">
                Logo, background, layout customization
              </p>
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform ${landingBrandingOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 pt-0 space-y-4">
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
                      label="Avatar"
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
                  <FormLabel>Landing Tagline</FormLabel>
                  <FormControl>
                    <Input placeholder="Welcome to our chat" {...field} className="bg-background" />
                  </FormControl>
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
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="pattern">Pattern</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          <Input type="color" {...field} className="h-10 w-20 cursor-pointer" />
                          <Input type="text" {...field} className="bg-background font-mono" />
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
                          <Input type="color" {...field} className="h-10 w-20 cursor-pointer" />
                          <Input type="text" {...field} className="bg-background font-mono" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {form.watch("backgroundStyle") === "solid" && (
              <FormField
                control={form.control}
                name="backgroundColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Background Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input type="color" {...field} className="h-10 w-20 cursor-pointer" />
                        <Input type="text" {...field} className="bg-background font-mono" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

            <FormField
              control={form.control}
              name="fontFamily"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Font Family</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Collapsible Section 2: Messages & Appearance */}
        <Collapsible open={messagesAppearanceOpen} onOpenChange={setMessagesAppearanceOpen} className="border rounded-lg">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="text-left">
              <h3 className="font-medium flex items-center gap-2">
                💬 Messages & Appearance
              </h3>
              <p className="text-sm text-muted-foreground">
                Message style, density, and colors
              </p>
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform ${messagesAppearanceOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 pt-0 space-y-4">
            <FormField
              control={form.control}
              name="messageBubbleStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Bubble Style</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
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

            <FormField
              control={form.control}
              name="messageDensity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Density</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
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

            <FormField
              control={form.control}
              name="showTimestamps"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                  <div className="space-y-0.5">
                    <FormLabel>Show Timestamps</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Display message timestamps
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="userMessageColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Message Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input type="color" {...field} className="h-10 w-20 cursor-pointer" />
                        <Input type="text" {...field} className="bg-background font-mono" />
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
                        <Input type="color" {...field} className="h-10 w-20 cursor-pointer" />
                        <Input type="text" {...field} className="bg-background font-mono" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Collapsible Section 3: Quick Start & Entry */}
        <Collapsible open={quickStartOpen} onOpenChange={setQuickStartOpen} className="border rounded-lg">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="text-left">
              <h3 className="font-medium flex items-center gap-2">
                🎯 Quick Start & Entry Experience
              </h3>
              <p className="text-sm text-muted-foreground">
                Prompts and welcome screen settings
              </p>
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform ${quickStartOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 pt-0 space-y-4">
            <FormField
              control={form.control}
              name="quickStartPromptsAutoSend"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                  <div className="space-y-0.5">
                    <FormLabel>Auto-send on Click</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Send prompts immediately when clicked
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
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

            <div className="border-t pt-4">
              <FormField
                control={form.control}
                name="welcomeScreenEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Welcome Screen</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Show a welcome screen before chat starts
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("welcomeScreenEnabled") && (
              <>
                <FormField
                  control={form.control}
                  name="welcomeSubtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Welcome Subtitle</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional subtitle" {...field} className="bg-background" />
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
                        <Textarea
                          placeholder="Optional disclaimer text"
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

        {/* Collapsible Section 4: Button & Input Styling */}
        <Collapsible open={buttonInputOpen} onOpenChange={setButtonInputOpen} className="border rounded-lg">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="text-left">
              <h3 className="font-medium flex items-center gap-2">
                🎨 Button & Input Styling
              </h3>
              <p className="text-sm text-muted-foreground">
                Button styles and border radius
              </p>
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform ${buttonInputOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 pt-0 space-y-4">
            <FormField
              control={form.control}
              name="buttonStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Button Style</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="filled">Filled</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inputStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Input Style</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                      <SelectItem value="underline">Underline</SelectItem>
                    </SelectContent>
                  </Select>
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
                      onValueChange={(value) => field.onChange(value[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input type="color" {...field} className="h-10 w-20 cursor-pointer" />
                      <Input type="text" {...field} className="bg-background font-mono" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Collapsible Section 5: Advanced */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="border rounded-lg">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="text-left">
              <h3 className="font-medium flex items-center gap-2">
                ⚙️ Advanced Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Color mode and input customization
              </p>
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 pt-0 space-y-4">
            <FormField
              control={form.control}
              name="colorMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Mode</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormDescription>
                    Placeholder text for the message input field
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="useLandingPageMode"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                  <div className="space-y-0.5">
                    <FormLabel>Use Landing Page Mode</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Show landing page before chat interface
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !!slugError}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Chat Interface' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
