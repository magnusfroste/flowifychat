/**
 * Chat Configuration Type Definitions
 * Single source of truth for all chat configuration types
 */

// ============================================
// CORE CONFIGURATION TYPES
// ============================================

/**
 * Quick Start Prompt Definition
 */
export interface QuickStartPrompt {
  id: string;
  text: string;
  enabled: boolean;
}

/**
 * Welcome Screen Configuration
 */
export interface WelcomeScreenConfig {
  enabled: boolean;
  subtitle?: string;
  disclaimer?: string;
}

/**
 * Metadata Configuration
 */
export interface MetadataConfig {
  includeReferrer: boolean;
  includeUserAgent: boolean;
  customFields: Record<string, string>;
}

/**
 * Input Configuration
 */
export interface InputConfig {
  placeholder: string;
  submitLabel: string;
}

/**
 * Quick Start Prompts Configuration
 */
export interface QuickStartPromptsConfig {
  prompts: QuickStartPrompt[];
  autoSend: boolean;
}

/**
 * Chat UX Configuration
 */
export interface ChatUXConfig {
  useLandingPageMode: boolean;
}

// ============================================
// COMPREHENSIVE CHAT BRANDING TYPE
// ============================================

/**
 * Chat Type - Public vs Authenticated
 */
export type ChatType = 'public' | 'authenticated';

/**
 * Complete Chat Branding Configuration
 * This is the main type used throughout the application
 */
export interface ChatBranding {
  // Core Branding
  primaryColor: string;
  accentColor: string;
  avatarUrl: string | null;
  welcomeMessage: string;
  chatTitle: string;
  quickStartPrompts?: QuickStartPrompt[];
  welcomeScreen?: WelcomeScreenConfig;
  inputPlaceholder?: string;
  inputSubmitLabel?: string;
  metadata?: MetadataConfig;
  useLandingPageMode?: boolean;
  
  // Landing Page Branding
  logoUrl?: string;
  landingTagline?: string;
  backgroundStyle?: 'solid' | 'gradient' | 'pattern';
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundColor?: string;
  layoutStyle?: 'centered' | 'left-visual' | 'compact';
  fontFamily?: string;
  
  // Message Appearance
  messageBubbleStyle?: 'rounded' | 'sharp' | 'pill';
  messageDensity?: 'compact' | 'comfortable' | 'spacious';
  showTimestamps?: 'always' | 'hover' | 'never';
  
  // Button & Input Styling
  buttonStyle?: 'filled' | 'outline' | 'ghost';
  inputStyle?: 'outline' | 'filled' | 'underline';
  borderRadius?: number;
  
  // Advanced Colors
  secondaryColor?: string;
  userMessageColor?: string;
  botMessageColor?: string;
  
  // Layout Controls
  messageAlignment?: 'left' | 'center' | 'full-width';
  maxMessageWidth?: number;
  showAvatars?: boolean;
  showBotAvatar?: boolean;
  showUserAvatar?: boolean;
  showUserBubble?: boolean;
  userAvatarStyle?: 'circle' | 'rounded' | 'none';
  avatarSize?: 'small' | 'medium' | 'large';
  avatarPosition?: 'top' | 'center';
  showSidebar?: boolean;
  allowAnonymousHistory?: boolean;
  analyticsEnabled?: boolean;
  headerStyle?: 'minimal' | 'standard' | 'prominent';
  
  // Input Controls
  inputPosition?: 'floating' | 'sticky-bottom';
  inputSize?: 'compact' | 'comfortable' | 'large';
  sendButtonStyle?: 'icon' | 'text' | 'icon-text';
  
  // Message Behavior
  messageSpacing?: 'tight' | 'normal' | 'relaxed';
  animationSpeed?: 'fast' | 'normal' | 'slow';
  
  // Typography
  fontWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  lineHeight?: 'tight' | 'normal' | 'relaxed' | 'loose';
  letterSpacing?: 'tight' | 'normal' | 'wide';
  textColor?: string;
  
  // Interactive Elements
  messageActions?: 'inline' | 'hover' | 'menu' | 'openai-row';
  showCopyButton?: boolean;
  showRegenerateButton?: boolean;
  showThumbsButtons?: boolean;
  showShareButton?: boolean;
  showReadAloudButton?: boolean;
  
  // Input Accessories
  showAttachmentButton?: boolean;
  showVoiceButton?: boolean;
  
  // Welcome Screen (flat fields for form)
  welcomeScreenEnabled?: boolean;
  welcomeSubtitle?: string;
  welcomeDisclaimer?: string;
}

// ============================================
// FORM VALUES TYPE (for react-hook-form)
// ============================================

/**
 * Chat Form Values
 * Used by the configuration editor form
 */
export interface ChatFormValues {
  name: string;
  slug: string;
  webhookUrl: string;
  chatType?: ChatType;
  welcomeMessage: string;
  chatTitle: string;
  primaryColor: string;
  accentColor: string;
  quickStartPrompts?: QuickStartPrompt[];
  quickStartPromptsAutoSend?: boolean;
  welcomeScreenEnabled?: boolean;
  welcomeSubtitle?: string;
  welcomeDisclaimer?: string;
  inputPlaceholder?: string;
  useLandingPageMode?: boolean;
  
  // Landing Page Branding
  logoUrl?: string;
  avatarUrl?: string;
  landingTagline?: string;
  backgroundStyle?: 'solid' | 'gradient' | 'pattern';
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundColor?: string;
  layoutStyle?: 'centered' | 'left-visual' | 'compact';
  fontFamily?: string;
  
  // Message Appearance
  messageBubbleStyle?: 'rounded' | 'sharp' | 'pill';
  messageDensity?: 'compact' | 'comfortable' | 'spacious';
  showTimestamps?: 'always' | 'hover' | 'never';
  
  // Button & Input Styling
  buttonStyle?: 'filled' | 'outline' | 'ghost';
  inputStyle?: 'outline' | 'filled' | 'underline';
  borderRadius?: number;
  
  // Advanced Colors
  secondaryColor?: string;
  userMessageColor?: string;
  botMessageColor?: string;
  colorMode?: 'light' | 'dark' | 'auto';
  
  // Layout Controls
  messageAlignment?: 'left' | 'center' | 'full-width';
  maxMessageWidth?: number;
  showAvatars?: boolean;
  showBotAvatar?: boolean;
  showUserAvatar?: boolean;
  showUserBubble?: boolean;
  userAvatarStyle?: 'circle' | 'rounded' | 'none';
  avatarSize?: 'small' | 'medium' | 'large';
  avatarPosition?: 'top' | 'center';
  showSidebar?: boolean;
  allowAnonymousHistory?: boolean;
  analyticsEnabled?: boolean;
  headerStyle?: 'minimal' | 'standard' | 'prominent';
  
  // Input Controls
  inputPosition?: 'floating' | 'sticky-bottom';
  inputSize?: 'compact' | 'comfortable' | 'large';
  sendButtonStyle?: 'icon' | 'text' | 'icon-text';
  
  // Message Behavior
  messageSpacing?: 'tight' | 'normal' | 'relaxed';
  animationSpeed?: 'fast' | 'normal' | 'slow';
  
  // Interactive Elements
  messageActions?: 'inline' | 'hover' | 'menu' | 'openai-row';
  showCopyButton?: boolean;
  showRegenerateButton?: boolean;
  showThumbsButtons?: boolean;
  showShareButton?: boolean;
  showReadAloudButton?: boolean;
  
  // Typography
  textColor?: string;
  fontWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  lineHeight?: 'tight' | 'normal' | 'relaxed' | 'loose';
  letterSpacing?: 'tight' | 'normal' | 'wide';
  
  // Input Accessories
  showAttachmentButton?: boolean;
  showVoiceButton?: boolean;
  
  // n8n Authentication
  n8nAuthEnabled?: boolean;
  n8nAuthUsername?: string;
  n8nAuthPassword?: string;
}
