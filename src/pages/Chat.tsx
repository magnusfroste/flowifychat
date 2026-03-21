import { useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowDown } from "lucide-react";
import { useChatInstance } from "@/hooks/useChatInstance";
import { useChatMessages } from "@/hooks/useChatMessages";
import { ChatHeader } from "@/components/ChatHeader";
import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";
import { PublicChat } from "@/components/PublicChat";
import { ChatErrorBoundary } from "@/components/ChatErrorBoundary";
import {
  getQuickStartPromptsConfig,
  getWelcomeScreen,
  getInputConfig,
  getUXConfig,
  getLayoutConfig,
  getMessageBehaviorConfig,
  getInteractiveConfig,
} from "@/lib/chatConfig";
import { QuickStartPrompts } from "@/components/QuickStartPrompts";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatLandingPage } from "@/components/ChatLandingPage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatSidebar } from "@/components/ChatSidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { SignInPrompt } from "@/components/SignInPrompt";
import { ChatThemeProvider } from "@/theme/ChatThemeProvider";

// Helper component to dynamically offset the fixed input bar based on sidebar state
const FixedInputContainer = ({
  isFloating,
  hasSidebar,
  children,
}: {
  isFloating: boolean;
  hasSidebar: boolean;
  children: React.ReactNode;
}) => {
  const { open: sidebarOpen, isMobile } = useSidebar();

  const leftOffset =
    !isFloating && hasSidebar && !isMobile
      ? sidebarOpen
        ? "var(--sidebar-width)"
        : "var(--sidebar-width-icon)"
      : "0";

  return (
    <div
      className={`right-0 border-t border-border/20 bg-background/80 backdrop-blur-sm pb-safe-or-4 transition-all duration-200 ${
        isFloating
          ? "relative max-w-3xl mx-auto rounded-t-xl shadow-lg"
          : "fixed bottom-0"
      }`}
      style={{
        left: leftOffset,
        ["--input-bar-height" as string]: "6rem",
      }}
    >
      {children}
    </div>
  );
};

const Chat = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    chatInstance,
    chatInstances,
    user,
    isOwner,
    loading,
  } = useChatInstance(id);

  const {
    messages,
    input,
    setInput,
    sending,
    sessionId,
    chatMode,
    isTypingPrompt,
    handleSend,
    typeAndSend,
    handleRegenerate,
    handleResetSession,
    handleSessionSelect,
    handleCopyMessage,
    handleCopyCode,
    copiedMessageId,
    copiedCodeBlock,
    showScrollButton,
    scrollToBottom,
    messagesEndRef,
  } = useChatMessages({
    chatInstance,
    user,
    forceNewSession: searchParams.get("new") === "1",
  });

  // Keyboard shortcut: Cmd+[ or Ctrl+[ for quick navigation to dashboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "[") {
        e.preventDefault();
        navigate("/dashboard");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const handleNewSession = () => {
    handleResetSession();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chatInstance) return null;

  // PUBLIC CHAT MODE
  if (chatInstance.chat_type === "public") {
    return (
      <ChatErrorBoundary chatName={chatInstance.name}>
        <PublicChat chatInstance={chatInstance} />
      </ChatErrorBoundary>
    );
  }

  // AUTHENTICATED CHAT MODE
  const branding = chatInstance.custom_branding;
  const quickStartConfig = getQuickStartPromptsConfig(branding);
  const welcomeScreenConfig = getWelcomeScreen(branding);
  const inputConfig = getInputConfig(branding);
  const layoutConfig = getLayoutConfig(branding);
  const behaviorConfig = getMessageBehaviorConfig(branding);
  const interactiveConfig = getInteractiveConfig(branding);
  const uxConfig = getUXConfig(branding);

  const inputStyle = ((branding?.inputStyle as string) || "outline") as 'outline' | 'filled' | 'underline';
  const buttonStyle = ((branding?.buttonStyle as string) || "filled") as 'filled' | 'ghost' | 'outline';

  const bgStyles =
    branding?.backgroundStyle === "gradient" &&
    branding?.backgroundGradientStart &&
    branding?.backgroundGradientEnd
      ? {
          background: `linear-gradient(135deg, ${branding.backgroundGradientStart}, ${branding.backgroundGradientEnd})`,
        }
      : branding?.backgroundColor
      ? { backgroundColor: branding.backgroundColor as string }
      : {};

  const chatStyleVars = {
    ["--chat-primary" as string]: chatInstance.custom_branding.primaryColor,
    ["--chat-accent" as string]: chatInstance.custom_branding.accentColor || "",
  };

  const renderLandingContent = (promptClickHandler: (text: string) => void) => (
    <ChatLandingPage
      branding={branding}
      quickStartPrompts={quickStartConfig.prompts}
      inputPlaceholder={inputConfig.placeholder}
      input={input}
      onInputChange={setInput}
      onSend={handleSend}
      onPromptClick={promptClickHandler}
      sending={sending}
      autoSend={quickStartConfig.autoSend}
      isTypingPrompt={isTypingPrompt}
    />
  );

  const promptClickHandler = (text: string) => {
    if (quickStartConfig.autoSend) {
      typeAndSend(text);
    } else {
      setInput(text);
    }
  };

  // Landing page mode
  if (chatMode === "landing") {
    // ADMIN/OWNER VIEW
    if (isOwner) {
      return (
        <ChatErrorBoundary chatName={chatInstance.name}>
          <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full">
              <AppSidebar
                mode="chat"
                currentChatId={chatInstance.id}
                currentSessionId={sessionId}
                onSessionSelect={handleSessionSelect}
                onNewSession={handleNewSession}
                onChatSelect={(chatId) => {
                  const chat = chatInstances.find((c) => c.id === chatId);
                  if (chat) navigate(`/chat/${chat.slug || chat.id}`);
                }}
                userEmail={user?.email}
                onLogout={handleLogout}
              />
              <main
                className="flex-1 flex flex-col transition-all duration-200 ml-[var(--sidebar-width)]"
                style={{ ...bgStyles, ...chatStyleVars }}
              >
                <ChatHeader
                  isOwner={true}
                  chatTitle={chatInstance.name}
                  headerStyle={layoutConfig.headerStyle}
                  showTitle={false}
                  transparent={true}
                />
                <div className="flex-1 flex flex-col">
                  {renderLandingContent(promptClickHandler)}
                </div>
              </main>
            </div>
          </SidebarProvider>
        </ChatErrorBoundary>
      );
    }

    // PUBLIC USER VIEW
    return (
      <ChatErrorBoundary chatName={chatInstance.name}>
        <SidebarProvider defaultOpen={false}>
          <div className="flex min-h-screen w-full">
            <ChatSidebar
              chatInstanceId={chatInstance.id}
              currentSessionId={sessionId}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
              isOwner={false}
              userId={user?.id}
              routeId={id}
              chatSlug={chatInstance.slug}
              logoUrl={branding?.logoUrl as string | null}
              avatarUrl={branding?.avatarUrl as string | null}
              chatTitle={branding?.chatTitle as string}
            />
            <main
              className="flex-1 flex flex-col transition-all duration-200 ml-[var(--sidebar-width-icon)]"
              style={{ ...bgStyles, ...chatStyleVars }}
            >
              <ChatHeader
                isOwner={false}
                chatTitle={chatInstance.custom_branding.chatTitle}
                headerStyle={layoutConfig.headerStyle}
                showTitle={false}
                transparent={true}
              />
              <div className="flex-1 flex flex-col">
                {renderLandingContent(promptClickHandler)}
              </div>
            </main>
          </div>
        </SidebarProvider>
      </ChatErrorBoundary>
    );
  }

  // Full chat interface
  const fontFamily = (branding?.fontFamily as string) || "Inter";
  const hasSidebar = isOwner || !!(user || (layoutConfig.showSidebar && layoutConfig.allowAnonymousHistory));

  const getAnimationClass = () => {
    if (behaviorConfig.animationSpeed === "fast") return "animate-fade-in duration-150";
    if (behaviorConfig.animationSpeed === "slow") return "animate-fade-in duration-500";
    return "animate-fade-in";
  };

  return (
    <ChatErrorBoundary chatName={chatInstance.name}>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full" style={{ fontFamily }}>
          {/* Sidebar */}
          {isOwner ? (
            <AppSidebar
              mode="chat"
              currentChatId={chatInstance.id}
              currentSessionId={sessionId}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
              onChatSelect={(chatId) => {
                const chat = chatInstances.find((c) => c.id === chatId);
                if (chat) navigate(`/chat/${chat.slug || chat.id}`);
              }}
              userEmail={user?.email}
              onLogout={handleLogout}
            />
          ) : (
            (user || (layoutConfig.showSidebar && layoutConfig.allowAnonymousHistory)) && (
              <ChatSidebar
                chatInstanceId={chatInstance.id}
                currentSessionId={sessionId}
                onSessionSelect={handleSessionSelect}
                onNewSession={handleNewSession}
                isOwner={isOwner}
                userId={user?.id}
                routeId={id}
                chatSlug={chatInstance.slug}
                logoUrl={branding?.logoUrl as string | null}
                avatarUrl={branding?.avatarUrl as string | null}
                chatTitle={branding?.chatTitle as string}
              />
            )
          )}

          {/* Main content */}
          <div
            className={`flex-1 min-h-screen ${getAnimationClass()}`}
            style={{ ...bgStyles, ...chatStyleVars }}
          >
            <ChatHeader
              isOwner={isOwner}
              chatTitle={chatInstance.name}
              displayTitle={chatInstance.custom_branding.chatTitle}
              headerStyle={layoutConfig.headerStyle}
              user={user}
              useLandingPageMode={uxConfig.useLandingPageMode}
            />

            {chatMode === "welcome" ? (
              <WelcomeScreen
                config={welcomeScreenConfig}
                chatTitle={branding.chatTitle}
                primaryColor={branding.primaryColor}
                branding={branding}
                onStart={() => {}}
              />
            ) : (
              <>
                <div
                  className="mx-auto px-4 sm:px-6 lg:px-8 py-8"
                  style={{ maxWidth: `${layoutConfig.maxMessageWidth}px` }}
                >
                  {!user && !isOwner && messages.length >= 2 && (
                    <SignInPrompt onSignIn={() => navigate("/auth")} />
                  )}

                  <MessageList
                    messages={messages}
                    branding={branding}
                    layoutConfig={layoutConfig}
                    behaviorConfig={behaviorConfig}
                    interactiveConfig={interactiveConfig}
                    copiedMessageId={copiedMessageId}
                    copiedCodeBlock={copiedCodeBlock}
                    onCopyMessage={handleCopyMessage}
                    onCopyCode={handleCopyCode}
                    onRegenerate={handleRegenerate}
                    sending={sending}
                  />
                  {sending && (
                    <div className="flex justify-start animate-fade-in">
                      <Card className="bg-card">
                        <div className="p-4">
                          <TypingIndicator />
                        </div>
                      </Card>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {showScrollButton && (
                  <Button
                    onClick={scrollToBottom}
                    className="fixed bottom-[calc(var(--input-bar-height,6rem)+1rem)] right-8 rounded-full h-12 w-12 shadow-lg animate-fade-in z-50"
                    size="icon"
                    variant="secondary"
                  >
                    <ArrowDown className="h-5 w-5" />
                  </Button>
                )}

                <FixedInputContainer
                  isFloating={behaviorConfig.inputPosition === "floating"}
                  hasSidebar={hasSidebar}
                >
                  <div
                    className="mx-auto px-4 sm:px-6 lg:px-8 py-4"
                    style={{
                      maxWidth:
                        behaviorConfig.inputPosition === "floating"
                          ? "100%"
                          : `${layoutConfig.maxMessageWidth}px`,
                    }}
                  >
                    <ChatInput
                      value={input}
                      onChange={setInput}
                      onSend={() => handleSend()}
                      sending={sending}
                      placeholder={inputConfig.placeholder}
                      inputStyle={inputStyle}
                      buttonStyle={buttonStyle}
                      inputSize={behaviorConfig.inputSize}
                      primaryColor={chatInstance.custom_branding.primaryColor}
                    />
                  </div>
                </FixedInputContainer>
              </>
            )}
          </div>
        </div>
      </SidebarProvider>
    </ChatErrorBoundary>
  );
};

export default Chat;
