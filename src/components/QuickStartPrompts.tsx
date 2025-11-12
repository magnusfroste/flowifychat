/**
 * View Component: Quick Start Prompts
 * Displays suggested message prompts for users to click
 */

import { Button } from "@/components/ui/button";
import type { QuickStartPrompt } from "@/types/chatConfiguration";

interface QuickStartPromptsProps {
  prompts: QuickStartPrompt[];
  onPromptClick: (text: string) => void;
  disabled?: boolean;
  primaryColor: string;
}

export function QuickStartPrompts({
  prompts,
  onPromptClick,
  disabled,
  primaryColor,
}: QuickStartPromptsProps) {
  if (prompts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4 px-4">
      {prompts.map((prompt) => (
        <Button
          key={prompt.id}
          variant="outline"
          size="sm"
          onClick={() => onPromptClick(prompt.text)}
          disabled={disabled}
          className="text-xs hover:shadow-md transition-all"
          style={{ borderColor: primaryColor }}
        >
          {prompt.text}
        </Button>
      ))}
    </div>
  );
}
