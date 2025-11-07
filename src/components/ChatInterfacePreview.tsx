/**
 * Component: Chat Interface Preview
 * Shows realistic chat interface with mock messages
 */

import { Send, Bot, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TypingIndicator } from "@/components/TypingIndicator";
import type { ChatBranding } from "@/lib/chatConfig";

interface ChatInterfacePreviewProps {
  branding: ChatBranding;
  inputPlaceholder?: string;
}

const mockMessages = [
  { role: "assistant", content: "Hi! How can I help you today?" },
  { role: "user", content: "Can you help me understand how this works?" },
  { role: "assistant", content: "Of course! I'd be happy to help. This is a preview of your chat interface with all your customizations applied. You can see how messages, avatars, and input styling will look." },
];

export function ChatInterfacePreview({ branding, inputPlaceholder = "Type your message..." }: ChatInterfacePreviewProps) {
  const {
    primaryColor,
    userMessageColor,
    botMessageColor,
    backgroundColor,
    backgroundStyle,
    backgroundGradientStart,
    backgroundGradientEnd,
    avatarUrl,
    showAvatars = true,
    avatarSize = 'medium',
    avatarPosition = 'top',
    messageAlignment = 'left',
    maxMessageWidth = 800,
    messageBubbleStyle = 'rounded',
    messageDensity = 'comfortable',
    messageSpacing = 'normal',
    borderRadius = 8,
    inputSize = 'comfortable',
    sendButtonStyle = 'icon',
    inputPosition = 'sticky-bottom',
    headerStyle = 'standard',
    chatTitle = 'Chat Preview',
  } = branding;

  // Avatar size classes
  const avatarSizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-10 w-10',
  };

  // Message bubble classes
  const bubbleStyleClasses = {
    rounded: `rounded-${borderRadius}`,
    sharp: 'rounded-none',
    pill: 'rounded-full',
  };

  // Message density classes
  const densityClasses = {
    compact: 'px-3 py-1.5 text-sm',
    comfortable: 'px-4 py-2.5',
    spacious: 'px-5 py-4',
  };

  // Message spacing classes
  const spacingClasses = {
    tight: 'gap-2',
    normal: 'gap-4',
    relaxed: 'gap-6',
  };

  // Input size classes
  const inputSizeClasses = {
    compact: 'h-9 text-sm',
    comfortable: 'h-10',
    large: 'h-12 text-base',
  };

  // Message alignment
  const alignmentClasses = {
    left: 'max-w-full',
    center: 'mx-auto',
    'full-width': 'w-full max-w-full',
  };

  // Background style
  const backgroundStyles = backgroundStyle === 'gradient' && backgroundGradientStart && backgroundGradientEnd
    ? { background: `linear-gradient(135deg, ${backgroundGradientStart}, ${backgroundGradientEnd})` }
    : { backgroundColor };

  return (
    <div className="h-full flex flex-col" style={backgroundStyles}>
      {/* Header */}
      {headerStyle !== 'minimal' && (
        <div className="border-b bg-background/95 backdrop-blur px-4 py-3 flex items-center gap-3">
          {avatarUrl && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
            </Avatar>
          )}
          <h2 className="font-semibold">{chatTitle}</h2>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div 
          className={`flex flex-col ${spacingClasses[messageSpacing]}`}
          style={{ maxWidth: messageAlignment === 'center' ? maxMessageWidth : undefined }}
        >
          {mockMessages.map((message, index) => {
            const isUser = message.role === 'user';
            const messageColor = isUser ? userMessageColor : botMessageColor;
            const avatarAlignClass = avatarPosition === 'center' ? 'items-center' : 'items-start';

            return (
              <div
                key={index}
                className={`flex gap-3 ${avatarAlignClass} ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                } ${alignmentClasses[messageAlignment]}`}
              >
                {/* Avatar */}
                {showAvatars && (
                  <Avatar className={avatarSizeClasses[avatarSize]}>
                    {isUser ? (
                      <>
                        <AvatarFallback style={{ backgroundColor: primaryColor }}>
                          <User className="h-3 w-3 text-white" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback><Bot className="h-3 w-3" /></AvatarFallback>
                      </>
                    )}
                  </Avatar>
                )}

                {/* Message Bubble */}
                <div
                  className={`${densityClasses[messageDensity]} ${bubbleStyleClasses[messageBubbleStyle]} ${
                    messageAlignment === 'full-width' ? 'flex-1' : 'max-w-[80%]'
                  }`}
                  style={{ 
                    backgroundColor: messageColor,
                    color: isUser ? '#ffffff' : '#000000',
                  }}
                >
                  {message.content}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          <div className={`flex gap-3 items-start ${alignmentClasses[messageAlignment]}`}>
            {showAvatars && (
              <Avatar className={avatarSizeClasses[avatarSize]}>
                <AvatarImage src={avatarUrl} />
                <AvatarFallback><Bot className="h-3 w-3" /></AvatarFallback>
              </Avatar>
            )}
            <div
              className={`${densityClasses[messageDensity]} ${bubbleStyleClasses[messageBubbleStyle]}`}
              style={{ backgroundColor: botMessageColor }}
            >
              <TypingIndicator />
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div 
        className={`border-t bg-background/95 backdrop-blur p-4 ${
          inputPosition === 'floating' ? 'mx-4 mb-4 rounded-lg border shadow-lg' : ''
        }`}
      >
        <div className="flex gap-2 items-end" style={{ maxWidth: messageAlignment === 'center' ? maxMessageWidth : undefined, margin: messageAlignment === 'center' ? '0 auto' : undefined }}>
          <Input
            placeholder={inputPlaceholder}
            className={inputSizeClasses[inputSize]}
            style={{ borderRadius: `${borderRadius}px` }}
            disabled
          />
          <Button
            size={inputSize === 'compact' ? 'sm' : inputSize === 'large' ? 'lg' : 'default'}
            style={{ 
              backgroundColor: primaryColor,
              borderRadius: `${borderRadius}px`,
            }}
            className="shrink-0"
            disabled
          >
            {sendButtonStyle === 'text' && 'Send'}
            {sendButtonStyle === 'icon' && <Send className="h-4 w-4" />}
            {sendButtonStyle === 'icon-text' && (
              <>
                <Send className="h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
