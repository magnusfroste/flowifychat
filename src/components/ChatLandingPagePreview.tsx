/**
 * Component: Chat Landing Page Preview
 * Static preview of the landing page with branding applied
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import type { ChatBranding, QuickStartPrompt } from "@/types/chatConfiguration";
import { getInputSize, getInputClasses, getButtonClasses, getButtonVariant } from "@/theme/brandingStyles";

interface ChatLandingPagePreviewProps {
  branding: ChatBranding;
  inputPlaceholder: string;
  quickStartPrompts?: QuickStartPrompt[];
}

export function ChatLandingPagePreview({
  branding,
  inputPlaceholder,
  quickStartPrompts = [],
}: ChatLandingPagePreviewProps) {
  const fontFamily = branding.fontFamily || 'Inter';
  const bgStyle = branding.backgroundStyle === 'gradient' 
    ? { background: `linear-gradient(135deg, ${branding.backgroundGradientStart}, ${branding.backgroundGradientEnd})` }
    : branding.backgroundStyle === 'solid'
    ? { backgroundColor: branding.backgroundColor }
    : {};
  
  const borderRadius = branding.borderRadius || 8;
  const inputSize = branding.inputSize || 'comfortable';
  const inputStyle = branding.inputStyle || 'outline';
  const buttonStyle = branding.buttonStyle || 'filled';
  
  const inputSizeClass = getInputSize(inputSize);
  const inputStyleClasses = getInputClasses(inputStyle);
  const buttonClasses = getButtonClasses(buttonStyle);
  const buttonVariant = getButtonVariant(buttonStyle);
  
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-8" style={{ ...bgStyle, fontFamily }}>
      {branding.logoUrl && (
        <img src={branding.logoUrl} alt="Logo" className="h-16 mb-6" />
      )}
      
      <div className="w-full max-w-2xl mb-12 text-center">
        <h1 className="text-4xl font-semibold mb-2" style={{ color: branding.primaryColor }}>
          {branding.chatTitle}
        </h1>
        <p className="text-lg opacity-70 text-muted-foreground">
          {branding.landingTagline || 'Ready when you are.'}
        </p>
      </div>

      {/* Centered Input */}
      <div className="w-full max-w-2xl">
        <div className="relative mb-6">
          <Input
            value=""
            placeholder={inputPlaceholder}
            className={`${inputSizeClass} ${inputStyleClasses} shadow-lg border ${
              inputSize === 'compact' ? 'pr-10 pl-4' : inputSize === 'large' ? 'pr-16 pl-6' : 'pr-14 pl-5'
            }`}
            style={{ 
              borderColor: inputStyle === 'filled' ? 'transparent' : `${branding.primaryColor}20`,
              borderRadius: `${borderRadius}px`,
            }}
            disabled
            readOnly
          />
          <Button
            disabled
            size="icon"
            variant={buttonVariant}
            style={buttonStyle === 'filled' ? { 
              backgroundColor: branding.primaryColor,
              borderRadius: `${Math.min(borderRadius, 20)}px`,
            } : {
              borderRadius: `${Math.min(borderRadius, 20)}px`,
              borderColor: branding.primaryColor,
              color: branding.primaryColor,
            }}
            className={`absolute ${
              inputSize === 'large' ? 'right-2 top-1/2 -translate-y-1/2 h-10 w-10' : 'right-2 top-1/2 -translate-y-1/2 h-9 w-9'
            } shadow-lg ${buttonClasses}`}
          >
            <Send className={inputSize === 'large' ? 'h-5 w-5' : 'h-4 w-4'} />
          </Button>
        </div>

        {/* Quick Start Prompts - Only show enabled ones */}
        {quickStartPrompts.filter(p => p.enabled).length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {quickStartPrompts.filter(p => p.enabled).map((prompt) => (
              <Button
                key={prompt.id}
                variant="outline"
                size="sm"
                disabled
                className="text-sm"
                style={{ borderColor: branding.primaryColor }}
              >
                {prompt.text}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
