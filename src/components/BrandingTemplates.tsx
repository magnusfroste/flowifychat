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
  };
}

export const templates: BrandingTemplate[] = [
  {
    name: "Professional",
    description: "Clean and corporate",
    icon: Palette,
    values: {
      primaryColor: "#2563eb",
      accentColor: "#3b82f6",
      secondaryColor: "#64748b",
      userMessageColor: "#2563eb",
      botMessageColor: "#f1f5f9",
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
    },
  },
  {
    name: "Minimalist",
    description: "Simple and elegant",
    icon: Minimize2,
    values: {
      primaryColor: "#000000",
      accentColor: "#404040",
      secondaryColor: "#737373",
      userMessageColor: "#000000",
      botMessageColor: "#f5f5f5",
      backgroundColor: "#ffffff",
      backgroundStyle: 'solid',
      layoutStyle: 'compact',
      fontFamily: 'Inter',
      messageBubbleStyle: 'sharp',
      messageDensity: 'compact',
      borderRadius: 0,
      buttonStyle: 'outline',
      inputStyle: 'underline',
      colorMode: 'light',
    },
  },
  {
    name: "Bold",
    description: "High contrast and modern",
    icon: Zap,
    values: {
      primaryColor: "#7c3aed",
      accentColor: "#db2777",
      secondaryColor: "#059669",
      userMessageColor: "#7c3aed",
      botMessageColor: "#1f2937",
      backgroundColor: "#0f172a",
      backgroundStyle: 'gradient',
      backgroundGradientStart: "#0f172a",
      backgroundGradientEnd: "#1e293b",
      layoutStyle: 'left-visual',
      fontFamily: 'Roboto',
      messageBubbleStyle: 'rounded',
      messageDensity: 'comfortable',
      borderRadius: 12,
      buttonStyle: 'filled',
      inputStyle: 'filled',
      colorMode: 'dark',
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
