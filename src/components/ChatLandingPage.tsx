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
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 animate-fade-in" style={{ ...bgStyle, fontFamily }}>
      {branding.logoUrl && (
        <img src={branding.logoUrl} alt="Logo" className="h-16 mb-6 animate-scale-in" />
      )}
      
      <div className="w-full max-w-2xl mb-12 text-center animate-scale-in">
        <h1 className="text-4xl font-semibold mb-2" style={{ color: branding.primaryColor }}>
          {branding.chatTitle}
        </h1>
        <p className="text-muted-foreground text-lg">{branding.landingTagline || 'Ready when you are.'}</p>
      </div>

      {/* Centered Input */}
      <div className="w-full max-w-2xl animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex gap-2 mb-6">
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
            className="h-14 text-base bg-background shadow-lg border-2"
            style={{ borderColor: `${branding.primaryColor}20` }}
            disabled={sending || isTypingPrompt}
            autoFocus
          />
          <Button
            onClick={onSend}
            disabled={!input.trim() || sending || isTypingPrompt}
            style={{ 
              backgroundColor: branding.primaryColor,
              borderRadius: `${branding.borderRadius || 8}px`
            }}
            className={`text-primary-foreground h-14 px-8 shadow-lg ${input.trim() && !sending && !isTypingPrompt ? 'animate-pulse' : ''}`}
            size="lg"
          >
            {sending || isTypingPrompt ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
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
