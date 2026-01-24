/**
 * Model Layer: Chat Configuration Utilities
 * Provides type-safe access to chat branding configuration with fallbacks
 * 
 * All types are now consolidated in src/types/chatConfiguration.ts
 */

import type {
  QuickStartPrompt,
  WelcomeScreenConfig,
  MetadataConfig,
  InputConfig,
  QuickStartPromptsConfig,
  ChatUXConfig,
} from "@/types/chatConfiguration";

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
    enabled: branding?.welcomeScreenEnabled ?? false,
    subtitle: branding?.welcomeSubtitle,
    disclaimer: branding?.welcomeDisclaimer,
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

/**
 * Get layout configuration with fallback defaults
 */
export const getLayoutConfig = (branding: any) => {
  return {
    messageAlignment: branding?.messageAlignment || 'left',
    maxMessageWidth: branding?.maxMessageWidth || 800,
    showAvatars: branding?.showAvatars ?? true,
    avatarSize: branding?.avatarSize || 'medium',
    avatarPosition: branding?.avatarPosition || 'center',
    showSidebar: branding?.showSidebar ?? true,
    allowAnonymousHistory: branding?.allowAnonymousHistory ?? true,
    headerStyle: branding?.headerStyle || 'standard',
    analyticsEnabled: branding?.analyticsEnabled ?? true,
  };
};

/**
 * Get message behavior configuration with fallback defaults
 */
export const getMessageBehaviorConfig = (branding: any) => {
  return {
    messageSpacing: branding?.messageSpacing || 'normal',
    animationSpeed: branding?.animationSpeed || 'normal',
    inputPosition: branding?.inputPosition || 'sticky-bottom',
    inputSize: branding?.inputSize || 'comfortable',
    sendButtonStyle: branding?.sendButtonStyle || 'icon',
  };
};

/**
 * Get interactive elements configuration with fallback defaults
 */
export const getInteractiveConfig = (branding: any) => {
  return {
    messageActions: branding?.messageActions || 'inline',
    showCopyButton: branding?.showCopyButton ?? true,
    showRegenerateButton: branding?.showRegenerateButton ?? true,
  };
};
