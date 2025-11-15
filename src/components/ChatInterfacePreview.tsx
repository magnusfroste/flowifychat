/**
 * Component: Chat Interface Preview
 * Shows realistic chat interface with mock messages
 */

import { Send, Bot, User, Copy, Check, RotateCw, MoreVertical } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TypingIndicator } from "@/components/TypingIndicator";
import type { ChatBranding } from "@/types/chatConfiguration";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface ChatInterfacePreviewProps {
  branding: ChatBranding;
  inputPlaceholder?: string;
}

export function ChatInterfacePreview({ branding, inputPlaceholder = "Type your message..." }: ChatInterfacePreviewProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  
  const mockMessages = [
    { id: 1, role: "assistant", content: branding.welcomeMessage || "Hi! How can I help you today?" },
    { id: 2, role: "user", content: "Can you help me understand how this works?" },
    { id: 3, role: "assistant", content: "Of course! I'd be happy to help. This is a preview of your chat interface with all your customizations applied. You can see how messages, avatars, and input styling will look." },
  ];

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
    inputStyle = 'outline',
    buttonStyle = 'filled',
    messageActions = 'inline',
    showCopyButton = true,
    showRegenerateButton = true,
  } = branding;

  const handleCopyMessage = (messageId: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Avatar size classes
  const avatarSizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-10 w-10',
  };

  // Get border radius for message bubbles
  const getBubbleBorderRadius = () => {
    if (messageBubbleStyle === 'pill') return '9999px';
    if (messageBubbleStyle === 'sharp') return '0px';
    return `${borderRadius}px`;
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

  // Determine text color based on background brightness
  const getTextColor = (bgColor: string) => {
    if (bgColor === 'transparent') {
      return '#000000';
    }
    
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  // Background style
  const getBackgroundStyles = () => {
    if (backgroundStyle === 'gradient' && backgroundGradientStart && backgroundGradientEnd) {
      return { background: `linear-gradient(135deg, ${backgroundGradientStart}, ${backgroundGradientEnd})` };
    }
    
    return { backgroundColor };
  };
  
  const backgroundStyles = getBackgroundStyles();
  const headerBg = 'rgba(255, 255, 255, 0.7)';
  const headerTextColor = '#000000';
  const inputAreaBg = 'rgba(255, 255, 255, 0.7)';

  // Input style classes
  const getInputStyleClasses = () => {
    if (inputStyle === 'filled') {
      return 'bg-black/5 border-black/10';
    } else if (inputStyle === 'underline') {
      return 'border-0 border-b rounded-none';
    }
    return ''; // outline is default
  };

  // Button style based on buttonStyle prop
  const getButtonClasses = () => {
    if (buttonStyle === 'ghost') {
      return 'bg-transparent hover:bg-white/10 text-white border-0';
    } else if (buttonStyle === 'outline') {
      return 'bg-transparent hover:bg-white/10 border';
    }
    return ''; // filled is handled by inline styles
  };

  return (
    <div className="h-full flex flex-col" style={backgroundStyles}>
      {/* Header */}
      {headerStyle !== 'minimal' && (
        <div 
          className="border-b backdrop-blur px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: headerBg, color: headerTextColor, borderColor: 'rgba(0,0,0,0.1)' }}
        >
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
            const isLastMessage = index === mockMessages.length - 1;

            return (
              <div
                key={message.id}
                className={`group flex gap-3 ${avatarAlignClass} ${
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

                {/* Message Bubble with Timestamp and Actions */}
                <div className={messageAlignment === 'full-width' ? 'flex-1' : 'max-w-[80%]'}>
                  <div
                    className={`${densityClasses[messageDensity]} ${
                      messageAlignment === 'full-width' ? 'w-full' : ''
                    }`}
                    style={{ 
                      backgroundColor: messageColor,
                      color: messageColor === 'transparent' ? '#000000' : getTextColor(messageColor),
                      borderRadius: getBubbleBorderRadius(),
                    }}
                  >
                    {message.content}
                  </div>
                  
                  {/* Timestamp */}
                  {branding.showTimestamps !== 'never' && (
                    <div 
                      className={`text-xs mt-1 px-2 transition-opacity ${
                        branding.showTimestamps === 'hover' ? 'opacity-0 group-hover:opacity-100' : 'opacity-60'
                      }`}
                      style={{ color: '#666666' }}
                    >
                      {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}

                  {/* Action Buttons - Only for assistant messages */}
                  {!isUser && (
                    <>
                      {messageActions === 'inline' && (
                        <div className="flex gap-2 mt-2">
                          {showCopyButton && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className="h-7 px-2 opacity-80 hover:opacity-100 transition-opacity"
                              title="Copy"
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span className="ml-1">Copy</span>
                            </Button>
                          )}
                          {showRegenerateButton && isLastMessage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {}}
                              className="h-7 px-2 opacity-80 hover:opacity-100 transition-opacity"
                              title="Regenerate"
                            >
                              <RotateCw className="h-3 w-3" />
                              <span className="ml-1">Regenerate</span>
                            </Button>
                          )}
                        </div>
                      )}

                      {messageActions === 'hover' && (
                        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {showCopyButton && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className="h-7 px-2"
                              title="Copy"
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span className="ml-1">Copy</span>
                            </Button>
                          )}
                          {showRegenerateButton && isLastMessage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {}}
                              className="h-7 px-2"
                              title="Regenerate"
                            >
                              <RotateCw className="h-3 w-3" />
                              <span className="ml-1">Regenerate</span>
                            </Button>
                          )}
                        </div>
                      )}

                      {messageActions === 'menu' && (
                        <div className="mt-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-60 hover:opacity-100 transition-opacity"
                                title="Message actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {showCopyButton && (
                                <DropdownMenuItem onClick={() => handleCopyMessage(message.id, message.content)}>
                                  {copiedMessageId === message.id ? (
                                    <Check className="h-4 w-4 mr-2" />
                                  ) : (
                                    <Copy className="h-4 w-4 mr-2" />
                                  )}
                                  Copy
                                </DropdownMenuItem>
                              )}
                              {showRegenerateButton && isLastMessage && (
                                <DropdownMenuItem onClick={() => {}}>
                                  <RotateCw className="h-4 w-4 mr-2" />
                                  Regenerate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </>
                  )}
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
              className={`${densityClasses[messageDensity]}`}
              style={{ 
                backgroundColor: botMessageColor,
                color: botMessageColor === 'transparent' ? '#000000' : getTextColor(botMessageColor),
                borderRadius: getBubbleBorderRadius(),
              }}
            >
              <TypingIndicator dotColor={botMessageColor === 'transparent' ? '#000000' : getTextColor(botMessageColor)} />
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div 
        className={`border-t backdrop-blur p-4 ${
          inputPosition === 'floating' ? 'mx-4 mb-4 rounded-lg border shadow-lg' : ''
        }`}
        style={{ 
          backgroundColor: inputAreaBg, 
          borderColor: 'rgba(0,0,0,0.1)' 
        }}
      >
        <div className="relative" style={{ maxWidth: messageAlignment === 'center' ? maxMessageWidth : undefined, margin: messageAlignment === 'center' ? '0 auto' : undefined }}>
          <Input
            placeholder={inputPlaceholder}
            className={`${inputSizeClasses[inputSize]} ${getInputStyleClasses()} ${
              inputSize === 'compact' ? 'pr-10' : inputSize === 'large' ? 'pr-14' : 'pr-12'
            }`}
            style={{ borderRadius: `${borderRadius}px` }}
            disabled
          />
          <Button
            size="icon"
            variant="ghost"
            style={buttonStyle === 'filled' ? {
              backgroundColor: primaryColor,
              borderRadius: `${borderRadius}px`,
              color: getTextColor(primaryColor),
            } : {
              borderRadius: `${borderRadius}px`,
              borderColor: primaryColor,
              color: primaryColor,
            }}
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 ${getButtonClasses()}`}
            disabled
          >
            {sendButtonStyle === 'icon' && <Send className="h-4 w-4" />}
            {sendButtonStyle === 'text' && <Send className="h-4 w-4" />}
            {sendButtonStyle === 'icon-text' && <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
