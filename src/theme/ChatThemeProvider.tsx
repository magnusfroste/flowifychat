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
      vars['--bubble-user'] = branding.userMessageColor.startsWith('#') ? hexToHsl(branding.userMessageColor) : branding.userMessageColor;
      vars['--bubble-user-foreground'] = branding.userMessageColor.startsWith('#') ? getContrastColor(branding.userMessageColor) : getContrastColor('#000000');
    }
    
    // Set bot message bubble colors
    if (branding.botMessageColor) {
      vars['--bubble-bot'] = branding.botMessageColor.startsWith('#') ? hexToHsl(branding.botMessageColor) : branding.botMessageColor;
      vars['--bubble-bot-foreground'] = branding.botMessageColor.startsWith('#') ? getContrastColor(branding.botMessageColor) : getContrastColor('#000000');
    }
    
    // Set background color if specified
    if (branding.backgroundColor) {
      vars['--chat-bg'] = branding.backgroundColor;
    }

    // Set text color if specified (for Claude's warm dark brown)
    if (branding.textColor) {
      vars['--text-color'] = branding.textColor;
    }

    // Set font weight
    if (branding.fontWeight) {
      const weightMap = { normal: '400', medium: '500', semibold: '600' };
      vars['--font-weight'] = weightMap[branding.fontWeight as keyof typeof weightMap] || '400';
    }

    // Set line height
    if (branding.lineHeight) {
      const heightMap = { tight: '1.25', normal: '1.5', relaxed: '1.625', loose: '1.7' };
      vars['--line-height'] = heightMap[branding.lineHeight as keyof typeof heightMap] || '1.5';
    }
    
    return vars;
  }, [branding]);
  
  // Get font family class
  const fontClass = branding.fontFamily 
    ? `font-${branding.fontFamily.toLowerCase().replace(/\s+/g, '-').replace('dm-sans', 'chatgpt').replace('plus-jakarta-sans', 'claude')}`
    : '';

  return (
    <div style={cssVars as React.CSSProperties} className={fontClass}>
      {children}
    </div>
  );
}
