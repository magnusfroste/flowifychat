/**
 * View Component: Chat Input
 * Message input field with send button
 */

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  placeholder: string;
  inputStyle: 'outline' | 'filled' | 'underline';
  buttonStyle: 'filled' | 'ghost' | 'outline';
  inputSize: 'compact' | 'standard' | 'large';
  isDark: boolean;
  primaryColor: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  sending,
  placeholder,
  inputStyle,
  buttonStyle,
  inputSize,
  isDark,
  primaryColor,
}: ChatInputProps) {
  const getInputSize = () => {
    if (inputSize === 'compact') return 'h-10';
    if (inputSize === 'large') return 'h-14 text-base';
    return 'h-12';
  };

  const getInputStyleClasses = () => {
    if (inputStyle === 'filled') {
      return isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10';
    } else if (inputStyle === 'underline') {
      return 'border-0 border-b rounded-none';
    }
    return '';
  };

  const getButtonClasses = () => {
    if (buttonStyle === 'ghost') {
      return 'bg-transparent hover:bg-white/10 border-0';
    } else if (buttonStyle === 'outline') {
      return 'bg-transparent hover:bg-white/10 border';
    }
    return '';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        disabled={sending}
        className={`flex-1 ${getInputSize()} ${getInputStyleClasses()}`}
        style={{
          color: isDark ? '#ffffff' : '#000000',
        }}
      />
      <Button
        onClick={onSend}
        disabled={sending || !value.trim()}
        className={getButtonClasses()}
        style={{
          backgroundColor: buttonStyle === 'filled' ? primaryColor : undefined,
        }}
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
