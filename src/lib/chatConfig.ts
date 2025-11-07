/**
 * Model Layer: Chat Configuration Utilities
 * Provides type-safe access to chat branding configuration with fallbacks
 */

export interface QuickStartPrompt {
  id: string;
  text: string;
  enabled: boolean;
}

export interface WelcomeScreenConfig {
  enabled: boolean;
  subtitle?: string;
  disclaimer?: string;
}

export interface MetadataConfig {
  includeReferrer: boolean;
  includeUserAgent: boolean;
  customFields: Record<string, string>;
}

export interface InputConfig {
  placeholder: string;
  submitLabel: string;
}

export interface QuickStartPromptsConfig {
  prompts: QuickStartPrompt[];
  autoSend: boolean;
}

export interface ChatUXConfig {
  useLandingPageMode: boolean;
}

export interface ChatBranding {
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
  showTimestamps?: boolean;
  
  // Button & Input Styling
  buttonStyle?: 'filled' | 'outline' | 'ghost';
  inputStyle?: 'outline' | 'filled' | 'underline';
  borderRadius?: number;
  
  // Advanced Colors
  secondaryColor?: string;
  userMessageColor?: string;
  botMessageColor?: string;
  colorMode?: 'light' | 'dark' | 'auto';
}

/**
 * Get quick start prompts configuration with fallback
 */
export const getQuickStartPromptsConfig = (branding: any): QuickStartPromptsConfig => {
  return {
    prompts: branding?.quickStartPrompts?.filter((p: QuickStartPrompt) => p.enabled) || [],
    autoSend: branding?.quickStartPromptsAutoSend ?? true, // Default to auto-send
  };
};

/**
 * Get welcome screen configuration with fallback defaults
 */
export const getWelcomeScreen = (branding: any): WelcomeScreenConfig => {
  return {
    enabled: branding?.welcomeScreen?.enabled ?? false,
    subtitle: branding?.welcomeScreen?.subtitle,
    disclaimer: branding?.welcomeScreen?.disclaimer,
  };
};

/**
 * Get input configuration with fallback defaults
 */
export const getInputConfig = (branding: any): InputConfig => {
  return {
    placeholder: branding?.inputPlaceholder || "Type your message...",
    submitLabel: branding?.inputSubmitLabel || "Send",
  };
};

/**
 * Get metadata configuration with fallback defaults
 */
export const getMetadataConfig = (branding: any): MetadataConfig => {
  return {
    includeReferrer: branding?.metadata?.includeReferrer ?? true,
    includeUserAgent: branding?.metadata?.includeUserAgent ?? true,
    customFields: branding?.metadata?.customFields || {},
  };
};

/**
 * Get UX configuration with fallback defaults
 */
export const getUXConfig = (branding: any): ChatUXConfig => {
  return {
    useLandingPageMode: branding?.useLandingPageMode ?? true, // Default to landing page mode
  };
};
