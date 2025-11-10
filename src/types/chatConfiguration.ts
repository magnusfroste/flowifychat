/**
 * Chat Configuration Type Definitions
 * Shared types for chat configuration across the application
 */

import type { QuickStartPrompt } from "@/lib/chatConfig";

export interface ChatFormValues {
  name: string;
  slug: string;
  webhookUrl: string;
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
  avatarSize?: 'small' | 'medium' | 'large';
  avatarPosition?: 'top' | 'center';
  showSidebar?: boolean;
  allowAnonymousHistory?: boolean;
  headerStyle?: 'minimal' | 'standard' | 'prominent';
  
  // Input Controls
  inputPosition?: 'floating' | 'sticky-bottom';
  inputSize?: 'compact' | 'comfortable' | 'large';
  sendButtonStyle?: 'icon' | 'text' | 'icon-text';
  
  // Message Behavior
  messageSpacing?: 'tight' | 'normal' | 'relaxed';
  animationSpeed?: 'fast' | 'normal' | 'slow';
  
  // Interactive Elements
  messageActions?: 'inline' | 'hover' | 'menu';
  showCopyButton?: boolean;
  showRegenerateButton?: boolean;
  
  // n8n Authentication
  n8nAuthEnabled?: boolean;
  n8nAuthUsername?: string;
  n8nAuthPassword?: string;
}
