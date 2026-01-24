/**
 * Component: Chat Configuration Preview
 * Live preview of chat interface with current form settings
 */

import { useState, useEffect } from "react";
import { Monitor, Smartphone, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatInterfacePreview } from "@/components/ChatInterfacePreview";
import { ChatLandingPagePreview } from "@/components/ChatLandingPagePreview";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatThemeProvider } from "@/theme/ChatThemeProvider";
import type { ChatFormValues, ChatBranding } from "@/types/chatConfiguration";

interface ChatConfigurationPreviewProps {
  formValues: ChatFormValues;
  useLandingPageMode?: boolean;
}

export function ChatConfigurationPreview({ 
  formValues, 
  useLandingPageMode = true 
}: ChatConfigurationPreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [viewMode, setViewMode] = useState<'landing' | 'chat'>(
    useLandingPageMode ? 'landing' : 'chat'
  );
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);

  // Automatically switch to chat view if landing mode is disabled
  useEffect(() => {
    if (!useLandingPageMode && viewMode === 'landing') {
      setViewMode('chat');
    }
  }, [useLandingPageMode, viewMode]);

  // Show welcome screen when switching to chat view if enabled
  useEffect(() => {
    if (viewMode === 'chat' && formValues.welcomeScreenEnabled) {
      setShowWelcomeScreen(true);
    }
  }, [viewMode, formValues.welcomeScreenEnabled]);

  // Convert form values to ChatBranding format
  const branding: ChatBranding = {
    chatTitle: formValues.chatTitle || "Chat Preview",
    welcomeMessage: formValues.welcomeMessage || "",
    primaryColor: formValues.primaryColor || "#6366f1",
    accentColor: formValues.accentColor || "#8b5cf6",
    secondaryColor: formValues.secondaryColor || "#64748b",
    userMessageColor: formValues.userMessageColor || "#6366f1",
    botMessageColor: formValues.botMessageColor || "#f1f5f9",
    backgroundColor: formValues.backgroundColor || "#ffffff",
    backgroundStyle: formValues.backgroundStyle || 'solid',
    backgroundGradientStart: formValues.backgroundGradientStart,
    backgroundGradientEnd: formValues.backgroundGradientEnd,
    logoUrl: formValues.logoUrl,
    avatarUrl: formValues.avatarUrl,
    landingTagline: formValues.landingTagline,
    layoutStyle: formValues.layoutStyle || 'centered',
    fontFamily: formValues.fontFamily || 'Inter',
    messageBubbleStyle: formValues.messageBubbleStyle || 'rounded',
    messageDensity: formValues.messageDensity || 'comfortable',
    showTimestamps: formValues.showTimestamps || 'hover',
    buttonStyle: formValues.buttonStyle || 'filled',
    inputStyle: formValues.inputStyle || 'outline',
    borderRadius: formValues.borderRadius ?? 8,
    
    // Layout Controls
    messageAlignment: formValues.messageAlignment || 'left',
    maxMessageWidth: formValues.maxMessageWidth || 800,
    showAvatars: formValues.showAvatars ?? true,
    showBotAvatar: formValues.showBotAvatar,
    showUserAvatar: formValues.showUserAvatar,
    showUserBubble: formValues.showUserBubble,
    userAvatarStyle: formValues.userAvatarStyle,
    avatarSize: formValues.avatarSize || 'medium',
    avatarPosition: formValues.avatarPosition || 'top',
    showSidebar: formValues.showSidebar ?? false,
    headerStyle: formValues.headerStyle || 'standard',
    
    // Input Controls
    inputPosition: formValues.inputPosition || 'sticky-bottom',
    inputSize: formValues.inputSize || 'comfortable',
    sendButtonStyle: formValues.sendButtonStyle || 'icon',
    showAttachmentButton: formValues.showAttachmentButton,
    showVoiceButton: formValues.showVoiceButton,
    
    // Message Behavior
    messageSpacing: formValues.messageSpacing || 'normal',
    animationSpeed: formValues.animationSpeed || 'normal',
    
    // Interactive Elements
    messageActions: formValues.messageActions || 'inline',
    showCopyButton: formValues.showCopyButton ?? true,
    showRegenerateButton: formValues.showRegenerateButton ?? true,
    showThumbsButtons: formValues.showThumbsButtons,
    showShareButton: formValues.showShareButton,
    
    // Typography
    textColor: formValues.textColor,
    fontWeight: formValues.fontWeight,
    lineHeight: formValues.lineHeight,
    letterSpacing: formValues.letterSpacing,
    
    // Welcome Screen
    welcomeScreenEnabled: formValues.welcomeScreenEnabled,
    welcomeSubtitle: formValues.welcomeSubtitle,
    welcomeDisclaimer: formValues.welcomeDisclaimer,
  };

  const inputPlaceholder = formValues.inputPlaceholder || "Type your message...";

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      {/* Preview Header */}
      <div className="border-b bg-muted/30 p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Live Preview</h3>
          <p className="text-xs text-muted-foreground">See your changes in real-time</p>
        </div>
        
        {/* View and Device Toggles */}
        <div className="flex gap-3">
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              size="icon"
              variant={viewMode === 'landing' ? 'default' : 'outline'}
              onClick={() => setViewMode('landing')}
              className="h-8 w-8"
              title={useLandingPageMode ? "Landing View" : "Landing disabled in settings"}
              disabled={!useLandingPageMode}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={viewMode === 'chat' ? 'default' : 'outline'}
              onClick={() => setViewMode('chat')}
              className="h-8 w-8"
              title="Chat View"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>

          {/* Device Toggle */}
          <div className="flex gap-2 border-l pl-3">
            <Button
              type="button"
              size="icon"
              variant={device === 'desktop' ? 'default' : 'outline'}
              onClick={() => setDevice('desktop')}
              className="h-8 w-8"
              title="Desktop View"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={device === 'mobile' ? 'default' : 'outline'}
              onClick={() => setDevice('mobile')}
              className="h-8 w-8"
              title="Mobile View"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-hidden bg-muted/20 flex items-center justify-center p-4">
        <div
          className={`h-full bg-background border shadow-2xl overflow-hidden transition-all duration-300 ${
            device === 'desktop' 
              ? 'w-full rounded-lg' 
              : 'max-w-[375px] rounded-[2.5rem] border-[14px] border-gray-800'
          }`}
        >
          {/* Mobile Notch */}
          {device === 'mobile' && (
            <div className="h-6 bg-gray-800 rounded-b-2xl mx-auto w-40 relative -top-[14px]" />
          )}

          {/* Preview Content - Wrapped in ChatThemeProvider for proper CSS variable scoping */}
          <ChatThemeProvider branding={branding}>
            <div className={`h-full ${device === 'mobile' ? '-mt-6' : ''}`}>
              {viewMode === 'landing' ? (
                <ChatLandingPagePreview
                  branding={branding}
                  inputPlaceholder={inputPlaceholder}
                  quickStartPrompts={formValues.quickStartPrompts || []}
                />
              ) : formValues.welcomeScreenEnabled && showWelcomeScreen ? (
                <WelcomeScreen
                  config={{
                    enabled: true,
                    subtitle: formValues.welcomeSubtitle,
                    disclaimer: formValues.welcomeDisclaimer,
                  }}
                  chatTitle={formValues.chatTitle || "Chat Preview"}
                  primaryColor={formValues.primaryColor || "#6366f1"}
                  branding={branding}
                  onStart={() => setShowWelcomeScreen(false)}
                />
              ) : (
                <ChatInterfacePreview
                  branding={branding}
                  inputPlaceholder={inputPlaceholder}
                />
              )}
            </div>
          </ChatThemeProvider>
        </div>
      </div>

      {/* Preview Footer Note */}
      <div className="border-t bg-muted/30 p-3 text-center">
        <p className="text-xs text-muted-foreground">
          This is a preview. No messages will be sent.
        </p>
      </div>
    </Card>
  );
}
