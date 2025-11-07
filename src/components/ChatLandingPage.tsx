/**
 * View Component: Chat Landing Page
 * Clean, centered input field inspired by Claude/ChatGPT
 * Shows before the first message is sent
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import type { QuickStartPrompt, ChatBranding } from "@/lib/chatConfig";

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
  const colorMode = branding.colorMode || 'light';
  
  const getTextColor = (bgColor: string) => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };
  
  const isDark = colorMode === 'dark' || (branding.backgroundColor && getTextColor(branding.backgroundColor) === '#ffffff');
  
  const getInputStyleClasses = () => {
    if (inputStyle === 'filled') {
      return isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10';
    } else if (inputStyle === 'underline') {
      return 'border-0 border-b rounded-none';
    }
    return 'bg-background';
  };

  const getButtonClasses = () => {
    if (buttonStyle === 'ghost') {
      return 'bg-transparent hover:bg-white/10 border-0';
    } else if (buttonStyle === 'outline') {
      return 'bg-transparent hover:bg-white/10 border';
    }
    return '';
  };

  const getInputHeight = () => {
    if (inputSize === 'compact') return 'h-10';
    if (inputSize === 'large') return 'h-14 text-base';
    return 'h-12';
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 animate-fade-in" style={{ ...bgStyle, fontFamily }}>
      {branding.logoUrl && (
        <img src={branding.logoUrl} alt="Logo" className="h-16 mb-6 animate-scale-in" />
      )}
      
      <div className="w-full max-w-2xl mb-12 text-center animate-scale-in">
        <h1 className="text-4xl font-semibold mb-2" style={{ color: branding.primaryColor }}>
          {branding.chatTitle}
        </h1>
        <p className="text-lg opacity-70" style={{ color: isDark ? '#ffffff' : '#666666' }}>
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
            className={`${getInputHeight()} ${getInputStyleClasses()} shadow-lg border ${
              inputSize === 'compact' ? 'pr-10 pl-4' : inputSize === 'large' ? 'pr-16 pl-6' : 'pr-14 pl-5'
            } ${isDark && inputStyle === 'filled' ? 'placeholder:text-white/40' : ''}`}
            style={{ 
              borderColor: inputStyle === 'filled' ? 'transparent' : `${branding.primaryColor}20`,
              borderRadius: `${borderRadius}px`,
              color: isDark && inputStyle === 'filled' ? '#ffffff' : undefined,
            }}
            disabled={sending || isTypingPrompt}
            autoFocus
          />
          <Button
            onClick={onSend}
            disabled={!input.trim() || sending || isTypingPrompt}
            size="icon"
            style={buttonStyle === 'filled' ? { 
              backgroundColor: branding.primaryColor,
              borderRadius: `${Math.min(borderRadius, 20)}px`,
              color: getTextColor(branding.primaryColor),
            } : {
              borderRadius: `${Math.min(borderRadius, 20)}px`,
              borderColor: branding.primaryColor,
              color: branding.primaryColor,
            }}
            className={`absolute ${
              inputSize === 'large' ? 'right-2 top-1/2 -translate-y-1/2 h-10 w-10' : 'right-2 top-1/2 -translate-y-1/2 h-9 w-9'
            } shadow-lg ${getButtonClasses()} ${
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
