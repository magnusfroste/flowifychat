/**
 * Component: Chat Interface Preview
 * Shows realistic chat interface with mock messages
 */

import { Send, Bot, User, Copy, Check, RotateCw, MoreVertical, Sparkles, Zap, ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Paperclip, Mic } from "lucide-react";
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
import { 
  getBubbleRadius, 
  getDensityPadding, 
  getMessageSpacing,
  getInputSize,
  getInputClasses,
  getButtonClasses,
  getAvatarSize,
  getTypographyClasses,
  getInputShadow,
  getTransitionSpeed,
  getFontWeight,
} from "@/theme/brandingStyles";

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
    showBotAvatar,
    showUserAvatar,
    showUserBubble = true,
    userAvatarStyle = 'rounded',
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
    showThumbsButtons = false,
    showShareButton = false,
    showAttachmentButton = false,
    showVoiceButton = false,
  } = branding;

  // Determine actual avatar visibility
  const shouldShowBotAvatar = showBotAvatar ?? showAvatars;
  const shouldShowUserAvatar = showUserAvatar ?? false;

  const handleCopyMessage = (messageId: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Message alignment
  const alignmentClasses = {
    left: 'max-w-full',
    center: 'mx-auto',
    'full-width': 'w-full max-w-full',
  };

  // Calculate style classes using brandingStyles utilities
  const bubbleRadiusStyle = getBubbleRadius(messageBubbleStyle, borderRadius);
  const densityClass = getDensityPadding(messageDensity);
  const spacingClass = getMessageSpacing(messageSpacing);
  const avatarSizeClass = getAvatarSize(avatarSize);
  const inputSizeClass = getInputSize(inputSize);
  const inputClasses = getInputClasses(inputStyle);
  const buttonClasses = getButtonClasses(buttonStyle);
  const typographyClasses = getTypographyClasses(branding);
  const inputShadow = getInputShadow(inputStyle, chatTitle?.toLowerCase());
  const transitionSpeed = getTransitionSpeed(branding.animationSpeed);

  // Background style
  const getBackgroundStyles = () => {
    if (backgroundStyle === 'gradient' && backgroundGradientStart && backgroundGradientEnd) {
      return { background: `linear-gradient(135deg, ${backgroundGradientStart}, ${backgroundGradientEnd})` };
    }
    
    return { backgroundColor };
  };
  
  const backgroundStyles = getBackgroundStyles();

  // Determine header based on preset
  const getHeaderContent = () => {
    if (headerStyle === 'minimal') return null;
    
    // Claude style - warm header
    if (branding.fontFamily === 'Plus Jakarta Sans') {
      return (
        <div className="border-b bg-[#FFF8F0] px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#CC785C]" />
            <h2 className="text-lg font-light text-[#191514]">Claude</h2>
          </div>
        </div>
      );
    }
    
    // Grok style - bold green header
    if (branding.fontFamily === 'Inter') {
      return (
        <div className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-500" />
            <h2 className="text-base font-semibold text-gray-900">Grok</h2>
          </div>
        </div>
      );
    }
    
    // Playful style
    if (headerStyle === 'prominent') {
      return (
        <div className="border-b bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-4">
          <h2 className="text-lg font-semibold">{chatTitle}</h2>
        </div>
      );
    }
    
    // Standard header
    return (
      <div className="border-b backdrop-blur px-4 py-3 flex items-center gap-3 bg-background/70 text-foreground border-border/10">
        {avatarUrl && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
          </Avatar>
        )}
        <h2 className="font-semibold">{chatTitle}</h2>
      </div>
    );
  };

  return (
    <div className={`h-full flex flex-col ${getFontWeight(branding.fontWeight)}`} style={backgroundStyles}>
      {/* Header */}
      {getHeaderContent()}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div 
          className={`flex flex-col ${spacingClass}`}
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
                {/* Bot Avatar */}
                {!isUser && shouldShowBotAvatar && (
                  <Avatar className={avatarSizeClass}>
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback 
                      className={
                        branding.primaryColor === '#34d399' 
                          ? 'bg-[#34d399] text-white' 
                          : branding.primaryColor === '#ec4899'
                          ? 'bg-gradient-to-br from-[#ec4899] to-[#a855f7] text-white'
                          : branding.primaryColor === '#C15F3C'
                          ? 'bg-[#C15F3C] text-white'
                          : ''
                      }
                    >
                      <Bot className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                {/* User Avatar */}
                {isUser && shouldShowUserAvatar && (
                  <div 
                    className={`${avatarSizeClass} ${userAvatarStyle === 'circle' ? 'rounded-full' : 'rounded-md'} flex items-center justify-center text-white text-xs font-medium`}
                    style={{ backgroundColor: primaryColor }}
                  >
                    U
                  </div>
                )}

                {/* Message Bubble with Timestamp and Actions */}
                <div className={messageAlignment === 'full-width' ? 'flex-1' : 'max-w-[80%]'}>
                  {/* User message: check showUserBubble */}
                  {isUser && !showUserBubble ? (
                    <div 
                      className={`${densityClass} ${typographyClasses} ${transitionSpeed} text-right`}
                      style={{ color: branding.textColor || undefined }}
                    >
                      {message.content}
                    </div>
                  ) : (
                    <div
                      className={`${densityClass} ${typographyClasses} ${transitionSpeed} ${
                        messageAlignment === 'full-width' ? 'w-full' : ''
                      } ${isUser ? 'bg-[var(--bubble-user)] text-[var(--bubble-user-foreground)]' : (messageColor === 'transparent' ? '' : 'bg-[var(--bubble-bot)] text-[var(--bubble-bot-foreground)]')} ${branding.fontFamily === 'Inter' ? 'border border-gray-200' : ''}`}
                      style={{ 
                        backgroundColor: messageColor === 'transparent' ? 'transparent' : (messageColor || undefined),
                        borderRadius: bubbleRadiusStyle,
                        color: !isUser && branding.textColor ? branding.textColor : undefined,
                      }}
                    >
                      {message.content}
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  {branding.showTimestamps !== 'never' && (
                    <div 
                      className={`text-xs mt-1 px-2 transition-opacity text-muted-foreground ${
                        branding.showTimestamps === 'hover' ? 'opacity-0 group-hover:opacity-100' : 'opacity-60'
                      }`}
                    >
                      {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}

                  {/* Action Buttons - Only for assistant messages */}
                  {!isUser && (
                    <>
                      {/* OpenAI-style always-visible action row */}
                      {messageActions === 'openai-row' && (
                        <div className="flex items-center gap-1 mt-2">
                          {showCopyButton && (
                            <button
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className="p-1.5 rounded hover:bg-muted transition-colors"
                              title="Copy"
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          )}
                          {showThumbsButtons && (
                            <>
                              <button
                                className="p-1.5 rounded hover:bg-muted transition-colors"
                                title="Good response"
                              >
                                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                              </button>
                              <button
                                className="p-1.5 rounded hover:bg-muted transition-colors"
                                title="Bad response"
                              >
                                <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </>
                          )}
                          {showShareButton && (
                            <button
                              className="p-1.5 rounded hover:bg-muted transition-colors"
                              title="Share"
                            >
                              <Share2 className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                          {showRegenerateButton && isLastMessage && (
                            <button
                              className="p-1.5 rounded hover:bg-muted transition-colors"
                              title="Regenerate"
                            >
                              <RotateCw className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                          <button
                            className="p-1.5 rounded hover:bg-muted transition-colors"
                            title="More"
                          >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      )}

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
              <Avatar className={avatarSizeClass}>
                <AvatarImage src={avatarUrl} />
                <AvatarFallback><Bot className="h-3 w-3" /></AvatarFallback>
              </Avatar>
            )}
            <div
              className={`${densityClass} bg-card text-card-foreground`}
              style={{ 
                backgroundColor: botMessageColor || undefined,
                borderRadius: bubbleRadiusStyle,
              }}
            >
              <TypingIndicator />
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div 
        className={`border-t backdrop-blur p-4 bg-background/70 border-border/10 ${
          inputPosition === 'floating' ? 'mx-4 mb-4 rounded-lg border shadow-lg' : ''
        }`}
      >
        <div className="flex items-center gap-2" style={{ maxWidth: messageAlignment === 'center' ? maxMessageWidth : undefined, margin: messageAlignment === 'center' ? '0 auto' : undefined }}>
          {showAttachmentButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-foreground flex-shrink-0"
              disabled
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          )}
          <div className="relative flex-1">
            <Input
              placeholder={inputPlaceholder}
              className={`${inputSizeClass} ${inputClasses} ${inputShadow} ${
                inputSize === 'compact' ? 'pr-10' : inputSize === 'large' ? 'pr-14' : 'pr-12'
              }`}
              style={{ 
                borderRadius: `${borderRadius}px`,
                borderColor: branding.fontFamily === 'Plus Jakarta Sans' ? '#C15F3C' : 
                            branding.fontFamily === 'Inter' ? '#34D399' : undefined,
              }}
              disabled
            />
            <Button
              size="icon"
              variant="ghost"
              style={buttonStyle === 'filled' ? {
                backgroundColor: primaryColor,
                borderRadius: `${borderRadius}px`,
              } : {
                borderRadius: `${borderRadius}px`,
                borderColor: primaryColor,
                color: primaryColor,
              }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 ${buttonClasses}`}
              disabled
            >
              {sendButtonStyle === 'icon' && <Send className="h-4 w-4" />}
              {sendButtonStyle === 'text' && <Send className="h-4 w-4" />}
              {sendButtonStyle === 'icon-text' && <Send className="h-4 w-4" />}
            </Button>
          </div>
          {showVoiceButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-foreground flex-shrink-0"
              disabled
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
