import { useState, useEffect } from "react";
import { X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SignInPromptProps {
  onSignIn: () => void;
}

export function SignInPrompt({ onSignIn }: SignInPromptProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if prompt was previously dismissed
    const dismissed = localStorage.getItem('sign_in_prompt_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const hoursSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      
      // Show again after 24 hours
      if (hoursSinceDismissal < 24) {
        setIsDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('sign_in_prompt_dismissed', Date.now().toString());
  };

  if (isDismissed) return null;

  return (
    <Card className="mx-auto max-w-2xl mb-4 p-4 bg-primary/5 border-primary/20 relative animate-fade-in">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-start gap-3 pr-8">
        <div className="rounded-full bg-primary/10 p-2 mt-0.5">
          <LogIn className="h-4 w-4 text-primary" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-sm mb-1">Save your conversation history</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Sign in to access your chats from any device and never lose your conversation history.
          </p>
          
          <Button
            size="sm"
            onClick={onSignIn}
            className="bg-primary hover:bg-primary/90"
          >
            <LogIn className="h-3.5 w-3.5 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    </Card>
  );
}
