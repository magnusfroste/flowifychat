/**
 * ThemeLab: Development page for testing branding presets
 * Shows all 4 brand presets side-by-side with interactive controls
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatInterfacePreview } from '@/components/ChatInterfacePreview';
import { ChatLandingPagePreview } from '@/components/ChatLandingPagePreview';
import { templates } from '@/components/BrandingTemplates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatBranding } from '@/types/chatConfiguration';

export default function ThemeLab() {
  const [inputStyle, setInputStyle] = useState<'outline' | 'filled' | 'underline'>('outline');
  const [buttonStyle, setButtonStyle] = useState<'filled' | 'ghost' | 'outline'>('filled');
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [bubbleStyle, setBubbleStyle] = useState<'rounded' | 'sharp' | 'pill'>('rounded');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Theme Lab</h1>
          <p className="text-muted-foreground">
            Test all branding presets with different style combinations
          </p>
        </div>

        {/* Quick Controls */}
        <Card className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Input Style</label>
              <div className="flex gap-2">
                {(['outline', 'filled', 'underline'] as const).map((style) => (
                  <Button
                    key={style}
                    size="sm"
                    variant={inputStyle === style ? 'default' : 'outline'}
                    onClick={() => setInputStyle(style)}
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Button Style</label>
              <div className="flex gap-2">
                {(['filled', 'outline', 'ghost'] as const).map((style) => (
                  <Button
                    key={style}
                    size="sm"
                    variant={buttonStyle === style ? 'default' : 'outline'}
                    onClick={() => setButtonStyle(style)}
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Density</label>
              <div className="flex gap-2">
                {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
                  <Button
                    key={d}
                    size="sm"
                    variant={density === d ? 'default' : 'outline'}
                    onClick={() => setDensity(d)}
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bubble Style</label>
              <div className="flex gap-2">
                {(['rounded', 'sharp', 'pill'] as const).map((style) => (
                  <Button
                    key={style}
                    size="sm"
                    variant={bubbleStyle === style ? 'default' : 'outline'}
                    onClick={() => setBubbleStyle(style)}
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Presets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {templates.map((template) => {
            // Apply current test settings to template
            const testBranding: ChatBranding = {
              ...template.values,
              inputStyle,
              buttonStyle,
              messageDensity: density,
              messageBubbleStyle: bubbleStyle,
              // Required fields with defaults
              avatarUrl: null,
              welcomeMessage: 'Welcome!',
              chatTitle: template.name,
            };

            return (
              <Card key={template.name} className="overflow-hidden">
                <div className="p-4 border-b bg-muted/50">
                  <div className="flex items-center gap-3">
                    <template.icon className="h-5 w-5" />
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="chat" className="w-full">
                  <TabsList className="w-full rounded-none">
                    <TabsTrigger value="chat" className="flex-1">
                      Chat Interface
                    </TabsTrigger>
                    <TabsTrigger value="landing" className="flex-1">
                      Landing Page
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="chat" className="p-0 m-0">
                    <div className="h-[600px] overflow-hidden">
                      <ChatInterfacePreview branding={testBranding} />
                    </div>
                  </TabsContent>

                  <TabsContent value="landing" className="p-0 m-0">
                    <div className="h-[600px] overflow-hidden">
                      <ChatLandingPagePreview 
                        branding={testBranding}
                        inputPlaceholder="Type your message..."
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
