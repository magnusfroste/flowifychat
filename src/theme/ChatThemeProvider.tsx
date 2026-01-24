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
    if (branding.userMessageColor && branding.userMessageColor !== 'transparent') {
      vars['--bubble-user'] = branding.userMessageColor.startsWith('#') ? hexToHsl(branding.userMessageColor) : branding.userMessageColor;
      vars['--bubble-user-foreground'] = branding.userMessageColor.startsWith('#') ? getContrastColor(branding.userMessageColor) : '0 0% 100%';
    }
    
    // Set bot message bubble colors
    if (branding.botMessageColor && branding.botMessageColor !== 'transparent') {
      vars['--bubble-bot'] = branding.botMessageColor.startsWith('#') ? hexToHsl(branding.botMessageColor) : branding.botMessageColor;
      vars['--bubble-bot-foreground'] = branding.botMessageColor.startsWith('#') ? getContrastColor(branding.botMessageColor) : '0 0% 0%';
    }
    
    // Set background color if specified (override theme background)
    if (branding.backgroundColor && !branding.backgroundColor.startsWith('hsl(var')) {
      const bgHsl = branding.backgroundColor.startsWith('#') 
        ? hexToHsl(branding.backgroundColor) 
        : branding.backgroundColor;
      vars['--background'] = bgHsl;
      vars['--chat-bg'] = branding.backgroundColor;
      
      // Check if dark background
      let isDarkBackground = false;
      if (branding.backgroundColor.startsWith('#')) {
        const hex = branding.backgroundColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        isDarkBackground = luminance < 0.3;
        
        if (isDarkBackground) {
          // Dark background - set light foreground and adjust UI colors
          vars['--foreground'] = '0 0% 98%';
          vars['--muted'] = '240 4% 16%';
          vars['--muted-foreground'] = '240 5% 65%';
          vars['--card'] = '240 6% 10%';
          vars['--card-foreground'] = '0 0% 98%';
          vars['--border'] = '240 6% 20%';
          vars['--input'] = '240 6% 20%';
          vars['--accent'] = '240 4% 16%';
          vars['--accent-foreground'] = '0 0% 98%';
        } else {
          // Light background - set dark foreground
          vars['--foreground'] = '0 0% 4%';
        }
      }
    }

    // Set explicit text color if specified (overrides auto-calculated foreground)
    // This allows presets like Grok (#fafafa) and Claude (#191514) to have exact text colors
    if (branding.textColor) {
      const textHsl = branding.textColor.startsWith('#') 
        ? hexToHsl(branding.textColor) 
        : branding.textColor;
      vars['--text-color'] = branding.textColor;
      vars['--foreground'] = textHsl;
      vars['--card-foreground'] = textHsl;
    }

    // Set font weight
    if (branding.fontWeight) {
      const weightMap = { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700' };
      vars['--font-weight'] = weightMap[branding.fontWeight as keyof typeof weightMap] || '400';
    }

    // Set line height
    if (branding.lineHeight) {
      const heightMap = { tight: '1.25', normal: '1.5', relaxed: '1.625', loose: '1.75' };
      vars['--line-height'] = heightMap[branding.lineHeight as keyof typeof heightMap] || '1.5';
    }
    
    return vars;
  }, [branding]);
  
  // Get font family class
  const getFontClass = () => {
    if (!branding.fontFamily) return '';
    const fontName = branding.fontFamily.toLowerCase();
    if (fontName.includes('inter')) return 'font-grok';
    if (fontName.includes('dm sans')) return 'font-chatgpt';
    if (fontName.includes('plus jakarta') || fontName.includes('jakarta')) return 'font-claude';
    if (fontName.includes('poppins')) return 'font-playful';
    return '';
  };

  return (
    <div style={cssVars as React.CSSProperties} className={getFontClass()}>
      {children}
    </div>
  );
}
