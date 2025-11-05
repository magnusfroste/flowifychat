/**
 * View Component: Chat Landing Page
 * Clean, centered input field inspired by Claude/ChatGPT
 * Shows before the first message is sent
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import type { QuickStartPrompt } from "@/lib/chatConfig";

interface ChatLandingPageProps {
  chatTitle: string;
  primaryColor: string;
  quickStartPrompts: QuickStartPrompt[];
  inputPlaceholder: string;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onPromptClick: (text: string) => void;
  sending: boolean;
  autoSend: boolean;
}

export function ChatLandingPage({
  chatTitle,
  primaryColor,
  quickStartPrompts,
  inputPlaceholder,
  input,
  onInputChange,
  onSend,
  onPromptClick,
  sending,
  autoSend,
}: ChatLandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Title at top-center */}
      <div className="w-full max-w-2xl mb-12 text-center">
        <h1 className="text-4xl font-semibold mb-2" style={{ color: primaryColor }}>
          {chatTitle}
        </h1>
        <p className="text-muted-foreground text-lg">Ready when you are.</p>
      </div>

      {/* Centered Input */}
      <div className="w-full max-w-2xl">
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
            style={{ borderColor: `${primaryColor}20` }}
            disabled={sending}
            autoFocus
          />
          <Button
            onClick={onSend}
            disabled={!input.trim() || sending}
            style={{ backgroundColor: primaryColor }}
            className="text-white h-14 px-8 shadow-lg"
            size="lg"
          >
            {sending ? (
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
                disabled={sending}
                className="text-sm hover:shadow-md transition-all"
                style={{ borderColor: primaryColor }}
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
