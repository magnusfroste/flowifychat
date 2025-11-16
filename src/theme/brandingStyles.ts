/**
 * Centralized branding utility functions
 * Eliminates code duplication across chat components
 */

/**
 * Get border radius classes for message bubbles
 */
export const getBubbleRadius = (style?: string, borderRadius?: number): string => {
  if (style === 'pill') return 'rounded-full';
  if (style === 'sharp') return 'rounded-none';
  
  if (!borderRadius) return 'rounded-lg';
  
  if (borderRadius >= 24) return 'rounded-3xl';
  if (borderRadius >= 20) return 'rounded-2xl';
  if (borderRadius >= 16) return 'rounded-xl';
  if (borderRadius >= 12) return 'rounded-lg';
  if (borderRadius >= 8) return 'rounded-md';
  
  return 'rounded';
};

/**
 * Get padding classes based on message density
 */
export const getDensityPadding = (density?: string): string => {
  switch (density) {
    case 'compact':
      return 'px-3 py-1.5';
    case 'spacious':
      return 'px-6 py-4';
    case 'comfortable':
    default:
      return 'px-4 py-3';
  }
};

/**
 * Get spacing classes between messages
 */
export const getMessageSpacing = (spacing?: string): string => {
  switch (spacing) {
    case 'tight':
      return 'space-y-2';
    case 'relaxed':
      return 'space-y-6';
    case 'normal':
    default:
      return 'space-y-4';
  }
};

/**
 * Get input size classes
 */
export const getInputSize = (size?: string): string => {
  switch (size) {
    case 'compact':
      return 'h-10 text-sm';
    case 'large':
      return 'h-14 text-base';
    case 'comfortable':
    default:
      return 'h-12 text-sm';
  }
};

/**
 * Get input style classes (theme-aware)
 */
export const getInputClasses = (inputStyle?: string): string => {
  switch (inputStyle) {
    case 'filled':
      return 'bg-muted/50 border-border hover:bg-muted/70 focus:bg-background';
    case 'underline':
      return 'border-0 border-b border-border rounded-none px-0 hover:border-foreground/50';
    case 'outline':
    default:
      return 'bg-background border-border hover:border-foreground/50';
  }
};

/**
 * Get button style classes (theme-aware)
 */
export const getButtonClasses = (buttonStyle?: string): string => {
  switch (buttonStyle) {
    case 'ghost':
      return 'bg-transparent hover:bg-muted border-0';
    case 'outline':
      return 'bg-transparent hover:bg-muted border border-border';
    case 'filled':
    default:
      return 'bg-primary text-primary-foreground hover:bg-primary/90';
  }
};

/**
 * Get avatar size classes
 */
export const getAvatarSize = (size?: string): string => {
  switch (size) {
    case 'small':
      return 'h-6 w-6';
    case 'large':
      return 'h-10 w-10';
    case 'medium':
    default:
      return 'h-8 w-8';
  }
};

/**
 * Get button size variant for shadcn Button component
 */
export const getButtonSizeVariant = (size?: string): "default" | "sm" | "lg" | "icon" => {
  switch (size) {
    case 'compact':
      return 'sm';
    case 'large':
      return 'lg';
    case 'comfortable':
    default:
      return 'default';
  }
};

/**
 * Get button variant for shadcn Button component
 */
export const getButtonVariant = (style?: string): "default" | "outline" | "ghost" => {
  switch (style) {
    case 'outline':
      return 'outline';
    case 'ghost':
      return 'ghost';
    case 'filled':
    default:
      return 'default';
  }
};
