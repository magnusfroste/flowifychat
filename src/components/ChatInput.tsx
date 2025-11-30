/**
 * View Component: Chat Input
 * Message input field with send button
 * Includes input validation for security
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { validateMessage } from "@/lib/inputValidation";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  placeholder: string;
  inputStyle: 'outline' | 'filled' | 'underline';
  buttonStyle: 'filled' | 'ghost' | 'outline';
  inputSize: 'compact' | 'standard' | 'large';
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
  primaryColor,
}: ChatInputProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const getInputSize = () => {
    if (inputSize === 'compact') return 'h-10';
    if (inputSize === 'large') return 'h-14 text-base';
    return 'h-12';
  };

  const getInputStyleClasses = () => {
    if (inputStyle === 'filled') {
      return 'bg-muted/50 border-muted';
    } else if (inputStyle === 'underline') {
      return 'border-0 border-b rounded-none';
    }
    return '';
  };

  const getButtonClasses = () => {
    if (buttonStyle === 'ghost') {
      return 'bg-transparent hover:bg-muted border-0';
    } else if (buttonStyle === 'outline') {
      return 'bg-transparent hover:bg-muted border';
    }
    return '';
  };

  const handleSend = () => {
    // Clear previous error
    setValidationError(null);
    
    // Validate input before sending
    const validation = validateMessage(value);
    if (!validation.success) {
      setValidationError(validation.error || "Invalid message");
      return;
    }
    
    onSend();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (newValue: string) => {
    // Clear error when user types
    if (validationError) {
      setValidationError(null);
    }
    onChange(newValue.slice(0, maxChars));
  };

  const charCount = value.length;
  const maxChars = 10000;
  const isNearLimit = charCount > maxChars * 0.9;

  return (
    <div className="space-y-1">
      <div className="flex gap-2 items-center">
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={sending}
          className={`flex-1 ${getInputSize()} ${getInputStyleClasses()} text-foreground ${validationError ? 'border-destructive' : ''}`}
        />
        <Button
          onClick={handleSend}
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
      {validationError && (
        <p className="text-xs text-destructive">{validationError}</p>
      )}
      {isNearLimit && !validationError && (
        <p className="text-xs text-muted-foreground text-right">
          {charCount}/{maxChars} characters
        </p>
      )}
    </div>
  );
}
