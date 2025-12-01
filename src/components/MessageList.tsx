/**
 * View Component: Message List
 * Renders chat messages with markdown support
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Copy, Check, RotateCw, ThumbsUp, ThumbsDown, Share2, MoreHorizontal, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  getBubbleRadius, 
  getDensityPadding, 
  getMessageSpacing,
  getAvatarSize,
  getTypographyClasses,
  getTransitionSpeed,
} from "@/theme/brandingStyles";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  branding: any;
  layoutConfig: any;
  behaviorConfig: any;
  interactiveConfig: any;
  copiedMessageId: string | null;
  copiedCodeBlock: string | null;
  onCopyMessage: (messageId: string, content: string) => void;
  onCopyCode: (code: string, blockId: string) => void;
  onRegenerate: () => void;
  sending: boolean;
}

export function MessageList({
  messages,
  branding,
  layoutConfig,
  behaviorConfig,
  interactiveConfig,
  copiedMessageId,
  copiedCodeBlock,
  onCopyMessage,
  onCopyCode,
  onRegenerate,
  sending,
}: MessageListProps) {
  const getMessageAlignment = () => {
    if (layoutConfig.messageAlignment === 'center') return 'mx-auto';
    if (layoutConfig.messageAlignment === 'full-width') return 'max-w-full';
    return '';
  };

  const bubbleRadiusStyle = getBubbleRadius(branding?.messageBubbleStyle, branding?.borderRadius);
  const densityClass = getDensityPadding(branding?.messageDensity);
  const spacingClass = getMessageSpacing(behaviorConfig.messageSpacing);
  const avatarSizeClass = getAvatarSize(layoutConfig.avatarSize);
  const typographyClasses = getTypographyClasses(branding);
  const transitionSpeed = getTransitionSpeed(behaviorConfig?.animationSpeed);

  const showTimestamps = branding?.showTimestamps || 'hover';
  const userMessageColor = branding?.userMessageColor;
  const botMessageColor = branding?.botMessageColor;
  const showUserBubble = branding?.showUserBubble ?? true;
  const shouldShowBotAvatar = branding?.showBotAvatar ?? layoutConfig.showAvatars;
  const shouldShowUserAvatar = branding?.showUserAvatar ?? false;

  return (
    <div className={`space-y-6 pb-[var(--input-bar-height,8rem)] ${getMessageAlignment()}`}>
      {messages.map((message, index) => {
        const isLastAssistantMessage = 
          message.role === "assistant" && 
          index === messages.length - 1;
        
        return (
          <div
            key={message.id}
            className={`flex animate-scale-in group ${getMessageSpacing()} ${
              layoutConfig.messageAlignment === 'full-width' 
                ? 'w-full' 
                : message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* Bot Avatar */}
            {message.role === "assistant" && shouldShowBotAvatar && branding.avatarUrl && (
              <div className={`${getAvatarSize()} rounded-full overflow-hidden mr-3 flex-shrink-0 ${layoutConfig.avatarPosition === 'top' ? 'mt-1' : 'self-center'}`}>
                <img 
                  src={branding.avatarUrl} 
                  alt="Bot"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* User Avatar */}
            {message.role === "user" && shouldShowUserAvatar && (
              <div 
                className={`${getAvatarSize()} rounded-full flex items-center justify-center text-white text-xs font-medium ml-3 flex-shrink-0 order-last`}
                style={{ backgroundColor: branding.primaryColor }}
              >
                U
              </div>
            )}

            <div className={`relative ${layoutConfig.messageAlignment === 'full-width' ? 'flex-1' : 'max-w-[80%]'}`}>
              {/* User message: check showUserBubble */}
              {message.role === "user" && !showUserBubble ? (
                <div 
                  className={`${densityClass} ${typographyClasses} ${transitionSpeed} text-right`}
                  style={{ color: branding?.textColor || undefined }}
                >
                  <div className="text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div
                  className={`${densityClass} ${typographyClasses} ${transitionSpeed} ${
                    message.role === "user" ? 'bg-[var(--bubble-user)] text-[var(--bubble-user-foreground)]' : (botMessageColor === 'transparent' ? '' : 'bg-[var(--bubble-bot)] text-[var(--bubble-bot-foreground)]')
                  }`}
                  style={{
                    borderRadius: bubbleRadiusStyle,
                    backgroundColor: message.role === "user" 
                      ? (showUserBubble ? (userMessageColor || undefined) : 'transparent')
                      : (botMessageColor === 'transparent' ? 'transparent' : (botMessageColor || undefined)),
                    color: message.role === "assistant" && branding?.textColor ? branding.textColor : undefined,
                  }}
                >
                  <div 
                    className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-pre:bg-muted prose-pre:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']"
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          const codeContent = String(children).replace(/\n$/, "");
                          const blockId = `${message.id}-${codeContent.substring(0, 20)}`;
                          const isDarkMode = document.documentElement.classList.contains('dark');
                          
                          return !inline && match ? (
                            <div className="relative group/code">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onCopyCode(codeContent, blockId)}
                                className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity h-8 w-8 p-0 z-10"
                                title="Copy code"
                              >
                                {copiedCodeBlock === blockId ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <SyntaxHighlighter
                                style={isDarkMode ? oneDark : oneLight}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {codeContent}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  {showTimestamps !== 'never' && (
                    <p 
                      className={`text-xs mt-2 text-muted-foreground transition-opacity ${
                        showTimestamps === 'hover' ? 'opacity-0 group-hover:opacity-70' : 'opacity-70'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}
              
              {/* OpenAI-style always-visible action row */}
              {interactiveConfig.messageActions === 'openai-row' && message.role === 'assistant' && (
                <div className="flex items-center gap-1 mt-2">
                  {interactiveConfig.showCopyButton && (
                    <button
                      onClick={() => onCopyMessage(message.id, message.content)}
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
                  {interactiveConfig.showThumbsButtons && (
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
                  {interactiveConfig.showShareButton && (
                    <button
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title="Share"
                    >
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                  {interactiveConfig.showRegenerateButton && isLastAssistantMessage && (
                    <button
                      onClick={onRegenerate}
                      disabled={sending}
                      className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50"
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
              
              {/* Default dropdown menu actions */}
              {interactiveConfig.showMessageActions && interactiveConfig.messageActions !== 'openai-row' && (
                <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {interactiveConfig.showCopyButton && (
                        <DropdownMenuItem onClick={() => onCopyMessage(message.id, message.content)}>
                          {copiedMessageId === message.id ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      {interactiveConfig.showRegenerateButton && isLastAssistantMessage && (
                        <DropdownMenuItem onClick={onRegenerate} disabled={sending}>
                          <RotateCw className="mr-2 h-4 w-4" />
                          Regenerate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
