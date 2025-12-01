/**
 * View Component: Branding Template Presets
 * One-click template application for common branding styles
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Palette, Minimize2, Zap } from "lucide-react";

export interface BrandingTemplate {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  values: {
    primaryColor: string;
    accentColor: string;
    secondaryColor: string;
    userMessageColor: string;
    botMessageColor: string;
    backgroundColor: string;
    backgroundStyle: 'solid' | 'gradient' | 'pattern';
    backgroundGradientStart?: string;
    backgroundGradientEnd?: string;
    layoutStyle: 'centered' | 'left-visual' | 'compact';
    fontFamily: string;
    fontWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
    lineHeight?: 'tight' | 'normal' | 'relaxed' | 'loose';
    letterSpacing?: 'tight' | 'normal' | 'wide';
    textColor?: string;
    messageBubbleStyle: 'rounded' | 'sharp' | 'pill';
    messageDensity: 'compact' | 'comfortable' | 'spacious';
    borderRadius: number;
    buttonStyle: 'filled' | 'outline' | 'ghost';
    inputStyle: 'outline' | 'filled' | 'underline';
    
    // Layout Controls
    messageAlignment: 'left' | 'center' | 'full-width';
    maxMessageWidth: number;
    showAvatars: boolean;
    showBotAvatar?: boolean;
    showUserAvatar?: boolean;
    showUserBubble?: boolean;
    userAvatarStyle?: 'circle' | 'rounded' | 'none';
    avatarSize: 'small' | 'medium' | 'large';
    avatarPosition: 'top' | 'center';
    showSidebar: boolean;
    headerStyle: 'minimal' | 'standard' | 'prominent';
    
    // Input Accessories
    showAttachmentButton?: boolean;
    showVoiceButton?: boolean;
    
    // Input Controls
    inputPosition: 'floating' | 'sticky-bottom';
    inputSize: 'compact' | 'comfortable' | 'large';
    sendButtonStyle: 'icon' | 'text' | 'icon-text';
    
    // Message Behavior
    messageSpacing: 'tight' | 'normal' | 'relaxed';
    animationSpeed: 'fast' | 'normal' | 'slow';
    showTimestamps: 'always' | 'hover' | 'never';
    
    // Interactive Elements
    messageActions: 'inline' | 'hover' | 'menu' | 'openai-row';
    showCopyButton: boolean;
    showRegenerateButton: boolean;
    showThumbsButtons?: boolean;
    showShareButton?: boolean;
  };
}

export const templates: BrandingTemplate[] = [
  {
    name: "OpenAI Style",
    description: "Clean, spacious ChatGPT design",
    icon: Zap,
    values: {
      primaryColor: "#10a37f",
      accentColor: "#0d8a6a",
      secondaryColor: "#8e8ea0",
      userMessageColor: "transparent",
      botMessageColor: "transparent",
      backgroundColor: "hsl(var(--background))",
      backgroundStyle: 'solid',
      layoutStyle: 'centered',
      fontFamily: 'DM Sans',
      fontWeight: 'normal',
      lineHeight: 'relaxed',
      letterSpacing: 'normal',
      messageBubbleStyle: 'pill',
      messageDensity: 'spacious',
      borderRadius: 24,
      buttonStyle: 'filled',
      inputStyle: 'outline',
      
      messageAlignment: 'center',
      maxMessageWidth: 768,
      showAvatars: false,
      showBotAvatar: false,
      showUserAvatar: true,
      showUserBubble: false,
      userAvatarStyle: 'circle',
      avatarSize: 'small',
      avatarPosition: 'top',
      showSidebar: false,
      headerStyle: 'minimal',
      
      inputPosition: 'sticky-bottom',
      inputSize: 'large',
      sendButtonStyle: 'icon',
      showAttachmentButton: true,
      showVoiceButton: true,
      
      messageSpacing: 'relaxed',
      animationSpeed: 'normal',
      showTimestamps: 'never',
      
      messageActions: 'openai-row',
      showCopyButton: true,
      showRegenerateButton: true,
      showThumbsButtons: true,
      showShareButton: true,
    },
  },
  {
    name: "Claude Style",
    description: "Warm, thoughtful Anthropic design",
    icon: Minimize2,
    values: {
      primaryColor: "#C15F3C",
      accentColor: "#C15F3C",
      secondaryColor: "#B1ADA1",
      userMessageColor: "transparent",
      botMessageColor: "transparent",
      backgroundColor: "#F4F3EE",
      backgroundStyle: 'solid',
      layoutStyle: 'centered',
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: 'light',
      lineHeight: 'loose',
      letterSpacing: 'normal',
      textColor: '#191514',
      messageBubbleStyle: 'rounded',
      messageDensity: 'spacious',
      borderRadius: 12,
      buttonStyle: 'ghost',
      inputStyle: 'outline',
      
      messageAlignment: 'center',
      maxMessageWidth: 700,
      showAvatars: false,
      showBotAvatar: true,
      showUserAvatar: false,
      showUserBubble: false,
      avatarSize: 'small',
      avatarPosition: 'top',
      showSidebar: false,
      headerStyle: 'minimal',
      
      inputPosition: 'sticky-bottom',
      inputSize: 'large',
      sendButtonStyle: 'icon',
      showAttachmentButton: true,
      showVoiceButton: false,
      
      messageSpacing: 'relaxed',
      animationSpeed: 'slow',
      showTimestamps: 'never',
      
      messageActions: 'hover',
      showCopyButton: true,
      showRegenerateButton: true,
    },
  },
  {
    name: "Grok Style",
    description: "Bold, modern xAI interface",
    icon: Zap,
    values: {
      primaryColor: "#34D399",
      accentColor: "#10B981",
      secondaryColor: "#4B5563",
      userMessageColor: "#e8fdf3",
      botMessageColor: "#f8f8f8",
      backgroundColor: "hsl(var(--background))",
      backgroundStyle: 'solid',
      layoutStyle: 'centered',
      fontFamily: 'Inter',
      fontWeight: 'semibold',
      lineHeight: 'normal',
      letterSpacing: 'tight',
      messageBubbleStyle: 'rounded',
      messageDensity: 'comfortable',
      borderRadius: 16,
      buttonStyle: 'filled',
      inputStyle: 'outline',
      
      messageAlignment: 'left',
      maxMessageWidth: 900,
      showAvatars: true,
      showBotAvatar: true,
      showUserAvatar: false,
      showUserBubble: true,
      avatarSize: 'medium',
      avatarPosition: 'center',
      showSidebar: false,
      headerStyle: 'minimal',
      
      inputPosition: 'sticky-bottom',
      inputSize: 'large',
      sendButtonStyle: 'icon',
      showAttachmentButton: true,
      showVoiceButton: false,
      
      messageSpacing: 'tight',
      animationSpeed: 'fast',
      showTimestamps: 'never',
      
      messageActions: 'hover',
      showCopyButton: true,
      showRegenerateButton: true,
    },
  },
  {
    name: "Playful",
    description: "Vibrant, energetic design",
    icon: Sparkles,
    values: {
      primaryColor: "#ec4899",
      accentColor: "#f472b6",
      secondaryColor: "#a855f7",
      userMessageColor: "#ec4899",
      botMessageColor: "#fef5fb",
      backgroundColor: "hsl(var(--background))",
      backgroundStyle: 'gradient',
      backgroundGradientStart: "#fff0f9",
      backgroundGradientEnd: "#f3f0ff",
      layoutStyle: 'centered',
      fontFamily: 'Poppins',
      fontWeight: 'medium',
      lineHeight: 'relaxed',
      letterSpacing: 'wide',
      messageBubbleStyle: 'pill',
      messageDensity: 'spacious',
      borderRadius: 24,
      buttonStyle: 'filled',
      inputStyle: 'filled',
      
      messageAlignment: 'left',
      maxMessageWidth: 750,
      showAvatars: true,
      showBotAvatar: true,
      showUserAvatar: true,
      showUserBubble: true,
      avatarSize: 'large',
      avatarPosition: 'top',
      showSidebar: false,
      headerStyle: 'standard',
      
      inputPosition: 'sticky-bottom',
      inputSize: 'large',
      sendButtonStyle: 'icon',
      showAttachmentButton: false,
      showVoiceButton: false,
      
      messageSpacing: 'relaxed',
      animationSpeed: 'fast',
      showTimestamps: 'hover',
      
      messageActions: 'inline',
      showCopyButton: true,
      showRegenerateButton: true,
    },
  },
];

interface BrandingTemplatesProps {
  onApplyTemplate: (template: BrandingTemplate) => void;
}

export function BrandingTemplates({ onApplyTemplate }: BrandingTemplatesProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Quick Start Templates</h3>
        <p className="text-xs text-muted-foreground">Apply a preset design with one click</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <Card
              key={template.name}
              className="p-4 cursor-pointer hover:border-primary transition-colors"
              onClick={() => onApplyTemplate(template)}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: template.values.primaryColor }}
                >
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-muted-foreground">{template.description}</div>
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  onApplyTemplate(template);
                }}>
                  Apply
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
