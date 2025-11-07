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
    messageBubbleStyle: 'rounded' | 'sharp' | 'pill';
    messageDensity: 'compact' | 'comfortable' | 'spacious';
    borderRadius: number;
    buttonStyle: 'filled' | 'outline' | 'ghost';
    inputStyle: 'outline' | 'filled' | 'underline';
    colorMode: 'light' | 'dark' | 'auto';
    
    // Layout Controls
    messageAlignment: 'left' | 'center' | 'full-width';
    maxMessageWidth: number;
    showAvatars: boolean;
    avatarSize: 'small' | 'medium' | 'large';
    avatarPosition: 'top' | 'center';
    showSidebar: boolean;
    headerStyle: 'minimal' | 'standard' | 'prominent';
    
    // Input Controls
    inputPosition: 'floating' | 'sticky-bottom';
    inputSize: 'compact' | 'comfortable' | 'large';
    sendButtonStyle: 'icon' | 'text' | 'icon-text';
    
    // Message Behavior
    messageSpacing: 'tight' | 'normal' | 'relaxed';
    animationSpeed: 'fast' | 'normal' | 'slow';
    showTimestamps: 'always' | 'hover' | 'never';
    
    // Interactive Elements
    messageActions: 'inline' | 'hover' | 'menu';
    showCopyButton: boolean;
    showRegenerateButton: boolean;
  };
}

export const templates: BrandingTemplate[] = [
  {
    name: "OpenAI Style",
    description: "ChatGPT-inspired interface",
    icon: Zap,
    values: {
      primaryColor: "#10a37f",
      accentColor: "#1a7f64",
      secondaryColor: "#8e8ea0",
      userMessageColor: "#f7f7f8",
      botMessageColor: "#ffffff",
      backgroundColor: "#ffffff",
      backgroundStyle: 'solid',
      layoutStyle: 'centered',
      fontFamily: 'Inter',
      messageBubbleStyle: 'rounded',
      messageDensity: 'comfortable',
      borderRadius: 8,
      buttonStyle: 'filled',
      inputStyle: 'outline',
      colorMode: 'light',
      
      messageAlignment: 'full-width',
      maxMessageWidth: 900,
      showAvatars: true,
      avatarSize: 'small',
      avatarPosition: 'top',
      showSidebar: true,
      headerStyle: 'minimal',
      
      inputPosition: 'sticky-bottom',
      inputSize: 'large',
      sendButtonStyle: 'icon',
      
      messageSpacing: 'normal',
      animationSpeed: 'normal',
      showTimestamps: 'hover',
      
      messageActions: 'inline',
      showCopyButton: true,
      showRegenerateButton: true,
    },
  },
  {
    name: "Claude Style",
    description: "Anthropic-inspired clean design",
    icon: Minimize2,
    values: {
      primaryColor: "#d97757",
      accentColor: "#cc6b47",
      secondaryColor: "#6b6b6b",
      userMessageColor: "#f5f5f5",
      botMessageColor: "#ffffff",
      backgroundColor: "#ffffff",
      backgroundStyle: 'solid',
      layoutStyle: 'centered',
      fontFamily: 'Inter',
      messageBubbleStyle: 'rounded',
      messageDensity: 'spacious',
      borderRadius: 12,
      buttonStyle: 'ghost',
      inputStyle: 'outline',
      colorMode: 'light',
      
      messageAlignment: 'center',
      maxMessageWidth: 700,
      showAvatars: false,
      avatarSize: 'medium',
      avatarPosition: 'top',
      showSidebar: false,
      headerStyle: 'minimal',
      
      inputPosition: 'floating',
      inputSize: 'large',
      sendButtonStyle: 'icon-text',
      
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
    description: "xAI-inspired dark interface",
    icon: Zap,
    values: {
      primaryColor: "#6ee7b7",
      accentColor: "#34d399",
      secondaryColor: "#9ca3af",
      userMessageColor: "#2d2d2d",
      botMessageColor: "#1f1f1f",
      backgroundColor: "#0f0f0f",
      backgroundStyle: 'solid',
      layoutStyle: 'centered',
      fontFamily: 'Inter',
      messageBubbleStyle: 'rounded',
      messageDensity: 'comfortable',
      borderRadius: 12,
      buttonStyle: 'ghost',
      inputStyle: 'filled',
      colorMode: 'dark',
      
      messageAlignment: 'center',
      maxMessageWidth: 800,
      showAvatars: false,
      avatarSize: 'small',
      avatarPosition: 'top',
      showSidebar: false,
      headerStyle: 'minimal',
      
      inputPosition: 'sticky-bottom',
      inputSize: 'large',
      sendButtonStyle: 'icon',
      
      messageSpacing: 'normal',
      animationSpeed: 'fast',
      showTimestamps: 'never',
      
      messageActions: 'hover',
      showCopyButton: true,
      showRegenerateButton: true,
    },
  },
  {
    name: "Playful",
    description: "Bright and fun",
    icon: Sparkles,
    values: {
      primaryColor: "#ec4899",
      accentColor: "#f59e0b",
      secondaryColor: "#8b5cf6",
      userMessageColor: "#ec4899",
      botMessageColor: "#fef3c7",
      backgroundColor: "#fdf4ff",
      backgroundStyle: 'gradient',
      backgroundGradientStart: "#fdf4ff",
      backgroundGradientEnd: "#fef3c7",
      layoutStyle: 'centered',
      fontFamily: 'Poppins',
      messageBubbleStyle: 'pill',
      messageDensity: 'spacious',
      borderRadius: 20,
      buttonStyle: 'filled',
      inputStyle: 'filled',
      colorMode: 'light',
      
      messageAlignment: 'left',
      maxMessageWidth: 750,
      showAvatars: true,
      avatarSize: 'large',
      avatarPosition: 'top',
      showSidebar: false,
      headerStyle: 'prominent',
      
      inputPosition: 'sticky-bottom',
      inputSize: 'large',
      sendButtonStyle: 'icon-text',
      
      messageSpacing: 'relaxed',
      animationSpeed: 'fast',
      showTimestamps: 'always',
      
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
                  <Icon className="w-6 h-6 text-white" />
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
