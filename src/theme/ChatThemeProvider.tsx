/**
 * ChatThemeProvider: Manages CSS variables for chat branding (Light Mode Only)
 * Converts branding config into scoped CSS variables that components can reference
 */

import { ReactNode, useMemo } from 'react';
import type { ChatBranding } from '@/types/chatConfiguration';

interface ChatThemeProviderProps {
  branding: ChatBranding;
  children: ReactNode;
}

/**
 * Convert hex color to HSL format for CSS variables
 */
function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Calculate contrast color (black or white) for given background
 */
function getContrastColor(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '0 0% 0%' : '0 0% 100%';
}

export function ChatThemeProvider({ branding, children }: ChatThemeProviderProps) {
  const cssVars = useMemo(() => {
    const vars: Record<string, string> = {};
    
    // Set primary color and its contrasting foreground
    if (branding.primaryColor) {
      vars['--primary'] = hexToHsl(branding.primaryColor);
      vars['--primary-foreground'] = getContrastColor(branding.primaryColor);
    }
    
    // Set user message bubble colors
    if (branding.userMessageColor) {
      vars['--bubble-user'] = branding.userMessageColor;
      vars['--bubble-user-foreground'] = getContrastColor(branding.userMessageColor);
    }
    
    // Set bot message bubble colors
    if (branding.botMessageColor) {
      vars['--bubble-bot'] = branding.botMessageColor;
      vars['--bubble-bot-foreground'] = getContrastColor(branding.botMessageColor);
    }
    
    // Set gradient background if configured
    if (branding.backgroundColor?.startsWith('linear-gradient')) {
      vars['--chat-bg'] = branding.backgroundColor;
    }
    
    return vars;
  }, [branding]);
  
  return (
    <div style={cssVars as React.CSSProperties}>
      {children}
    </div>
  );
}
