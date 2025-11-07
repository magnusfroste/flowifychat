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
  branding,
}: WelcomeScreenProps & { branding?: any }) {
  if (!config.enabled) return null;

  const fontFamily = branding?.fontFamily || 'Inter';
  const borderRadius = branding?.borderRadius || 8;
  const logoUrl = branding?.logoUrl;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4" style={{ fontFamily }}>
      <Card className="max-w-md w-full text-center" style={{ borderRadius: `${borderRadius}px` }}>
        <div className="p-8 space-y-4">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-16 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold">{chatTitle}</h2>
          {config.subtitle && (
            <p className="text-muted-foreground">{config.subtitle}</p>
          )}
          <Button
            onClick={onStart}
            size="lg"
            style={{ 
              backgroundColor: primaryColor,
              borderRadius: `${borderRadius}px`
            }}
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
