/**
 * View Component: Welcome Screen
 * Optional welcome overlay displayed before chat starts
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { WelcomeScreenConfig } from "@/lib/chatConfig";

interface WelcomeScreenProps {
  config: WelcomeScreenConfig;
  chatTitle: string;
  primaryColor: string;
  onStart: () => void;
}

export function WelcomeScreen({
  config,
  chatTitle,
  primaryColor,
  onStart,
}: WelcomeScreenProps) {
  if (!config.enabled) return null;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full text-center">
        <div className="p-8 space-y-4">
          <h2 className="text-2xl font-bold">{chatTitle}</h2>
          {config.subtitle && (
            <p className="text-muted-foreground">{config.subtitle}</p>
          )}
          <Button
            onClick={onStart}
            size="lg"
            style={{ backgroundColor: primaryColor }}
            className="text-primary-foreground"
          >
            Start Chat
          </Button>
          {config.disclaimer && (
            <p className="text-xs text-muted-foreground mt-4">
              {config.disclaimer}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
