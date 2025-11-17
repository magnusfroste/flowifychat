/**
 * View Component: Chat Landing Page
 * Clean, centered input field inspired by Claude/ChatGPT
 * Shows before the first message is sent
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import type { QuickStartPrompt, ChatBranding } from "@/types/chatConfiguration";
import { getInputSize, getInputClasses, getButtonClasses, getButtonVariant, getButtonSizeVariant } from "@/theme/brandingStyles";

interface ChatLandingPageProps {
  branding: ChatBranding;
  quickStartPrompts: QuickStartPrompt[];
  inputPlaceholder: string;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onPromptClick: (text: string) => void;
  sending: boolean;
  autoSend: boolean;
  isTypingPrompt?: boolean;
}

export function ChatLandingPage({
  branding,
  quickStartPrompts,
  inputPlaceholder,
  input,
  onInputChange,
  onSend,
  onPromptClick,
  sending,
  autoSend,
  isTypingPrompt = false,
}: ChatLandingPageProps) {
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
  const buttonSize = getButtonSizeVariant(inputSize);
  
  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-4 py-8 animate-fade-in" style={{ ...bgStyle, fontFamily }}>
      {branding.logoUrl && (
        <img src={branding.logoUrl} alt="Logo" className="h-16 mb-6 animate-scale-in" />
      )}
      
      <div className="w-full max-w-2xl mb-12 text-center animate-scale-in">
        <h1 className="text-4xl font-semibold mb-2" style={{ color: branding.primaryColor }}>
          {branding.chatTitle}
        </h1>
        <p className="text-lg opacity-70 text-muted-foreground">
          {branding.landingTagline || 'Ready when you are.'}
        </p>
      </div>

      {/* Centered Input */}
      <div className="w-full max-w-2xl animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <div className="relative mb-6">
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={inputPlaceholder}
            className={`${inputSizeClass} ${inputStyleClasses} shadow-lg border ${
              inputSize === 'compact' ? 'pr-10 pl-4' : inputSize === 'large' ? 'pr-16 pl-6' : 'pr-14 pl-5'
            }`}
            style={{ 
              borderColor: inputStyle === 'filled' ? 'transparent' : `${branding.primaryColor}20`,
              borderRadius: `${borderRadius}px`,
            }}
            disabled={sending || isTypingPrompt}
            autoFocus
          />
          <Button
            onClick={() => onSend()}
            disabled={!input.trim() || sending || isTypingPrompt}
            size={buttonSize}
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
            } shadow-lg ${buttonClasses} ${
              input.trim() && !sending && !isTypingPrompt ? 'animate-pulse' : ''
            }`}
          >
            {sending || isTypingPrompt ? (
              <Loader2 className={inputSize === 'large' ? 'h-5 w-5' : 'h-4 w-4'} />
            ) : (
              <Send className={inputSize === 'large' ? 'h-5 w-5' : 'h-4 w-4'} />
            )}
          </Button>
        </div>

        {/* Quick Start Prompts */}
        {quickStartPrompts.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {quickStartPrompts.map((prompt) => (
              <Button
                key={prompt.id}
                variant="outline"
                size="sm"
                onClick={() => onPromptClick(prompt.text)}
                disabled={sending || isTypingPrompt}
                className="text-sm hover:shadow-md transition-all"
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
