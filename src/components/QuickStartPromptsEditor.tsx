/**
 * Form Component: Quick Start Prompts Editor
 * Allows users to add, edit, remove, and reorder quick start prompts
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, Plus, GripVertical } from "lucide-react";
import type { QuickStartPrompt } from "@/lib/chatConfig";

interface QuickStartPromptsEditorProps {
  prompts: QuickStartPrompt[];
  onChange: (prompts: QuickStartPrompt[]) => void;
  maxPrompts?: number;
}

export function QuickStartPromptsEditor({
  prompts,
  onChange,
  maxPrompts = 5,
}: QuickStartPromptsEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = () => {
    if (prompts.length >= maxPrompts) return;

    onChange([
      ...prompts,
      {
        id: `prompt-${Date.now()}`,
        text: "",
        enabled: true,
      },
    ]);
    setEditingIndex(prompts.length);
  };

  const handleUpdate = (index: number, updates: Partial<QuickStartPrompt>) => {
    const updated = [...prompts];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(prompts.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <span className="text-xs text-muted-foreground">
          {prompts.length}/{maxPrompts}
        </span>
      </div>

      <div className="space-y-2">
        {prompts.map((prompt, index) => (
          <div
            key={prompt.id}
            className="flex items-center gap-2 p-3 rounded-md border bg-card"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <Input
                value={prompt.text}
                onChange={(e) =>
                  handleUpdate(index, { text: e.target.value })
                }
                placeholder="Enter prompt text..."
                maxLength={100}
                className="text-sm"
              />
            </div>
            <Switch
              checked={prompt.enabled}
              onCheckedChange={(enabled) =>
                handleUpdate(index, { enabled })
              }
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(index)}
              className="h-8 w-8 p-0 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {prompts.length < maxPrompts && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Prompt
        </Button>
      )}

      {prompts.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No prompts added. Click "Add Prompt" to create suggested messages.
        </p>
      )}
    </div>
  );
}
