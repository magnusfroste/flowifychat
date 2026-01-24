/**
 * Centralized branding utility functions
 * Eliminates code duplication across chat components
 */

/**
 * Get border radius CSS value for message bubbles (for inline styles)
 */
export const getBubbleRadius = (style?: string, borderRadius?: number): string => {
  if (style === 'pill') return '9999px';
  if (style === 'sharp') return '0px';
  
  if (borderRadius) return `${borderRadius}px`;
  
  // Default rounded-lg equivalent
  return '8px';
};

/**
 * Get border radius Tailwind class for message bubbles (for className)
 */
export const getBubbleRadiusClass = (style?: string, borderRadius?: number): string => {
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
export function getMessageSpacing(spacing?: string): string {
  switch (spacing) {
    case 'tight':
      return 'space-y-1';
    case 'relaxed':
      return 'space-y-10';
    default:
      return 'space-y-4';
  }
}

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
      return 'bg-transparent hover:bg-primary/10 border-0 text-primary';
    case 'outline':
      return 'bg-transparent hover:bg-primary/5 border-2 border-primary/30 text-primary';
    case 'filled':
    default:
      return 'bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] border-0';
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
      return 'h-12 w-12';
    case 'medium':
    default:
      return 'h-8 w-8';
  }
};

/**
 * Get font weight classes
 */
export const getFontWeight = (weight?: string): string => {
  switch (weight) {
    case 'light':
      return 'font-light';
    case 'normal':
      return 'font-normal';
    case 'medium':
      return 'font-medium';
    case 'semibold':
      return 'font-semibold';
    case 'bold':
      return 'font-bold';
    default:
      return 'font-normal';
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

/**
 * Get input shadow classes (theme-aware)
 */
export const getInputShadow = (inputStyle?: string, theme?: string): string => {
  if (inputStyle === 'outline' && theme === 'openai') {
    return 'shadow-sm hover:shadow-md transition-shadow';
  }
  return '';
};

/**
 * Get typography classes based on branding preset
 */
export const getTypographyClasses = (branding?: {
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
}): string => {
  const weight = branding?.fontWeight === 'medium' ? 'font-medium' : 
                 branding?.fontWeight === 'semibold' ? 'font-semibold' : 
                 'font-normal';
  
  const leading = branding?.lineHeight === 'tight' ? 'leading-tight' :
                  branding?.lineHeight === 'loose' ? 'leading-loose' :
                  branding?.lineHeight === 'relaxed' ? 'leading-relaxed' :
                  'leading-normal';
  
  const tracking = branding?.letterSpacing === 'tight' ? 'tracking-tight' :
                   branding?.letterSpacing === 'wide' ? 'tracking-wide' :
                   'tracking-normal';
  
  return `${weight} ${leading} ${tracking}`;
};

/**
 * Get transition speed classes
 */
export const getTransitionSpeed = (animationSpeed?: string): string => {
  switch (animationSpeed) {
    case 'fast':
      return 'transition-all duration-150';
    case 'slow':
      return 'transition-all duration-300';
    case 'normal':
    default:
      return 'transition-all duration-200';
  }
};

/**
 * Get user avatar style classes
 */
export const getUserAvatarClasses = (style?: string): string => {
  switch (style) {
    case 'circle':
      return 'rounded-full';
    case 'none':
      return 'hidden';
    case 'rounded':
    default:
      return 'rounded-md';
  }
};

/**
 * Get user message style based on showUserBubble
 */
export const getUserMessageStyle = (
  showBubble: boolean,
  messageColor?: string
): { className: string; backgroundColor?: string } => {
  if (!showBubble) {
    return {
      className: 'text-right',
      backgroundColor: 'transparent',
    };
  }
  return {
    className: 'bg-[var(--bubble-user)] text-[var(--bubble-user-foreground)]',
    backgroundColor: messageColor || undefined,
  };
};
