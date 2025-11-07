/**
 * View Component: Typing Indicator
 * Displays animated dots while assistant is typing
 */

interface TypingIndicatorProps {
  dotColor?: string;
}

export function TypingIndicator({ dotColor }: TypingIndicatorProps = {}) {
  return (
    <div className="flex gap-1 items-center">
      <span 
        className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s] ${!dotColor ? 'bg-muted-foreground' : ''}`}
        style={dotColor ? { backgroundColor: dotColor } : {}}
      />
      <span 
        className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s] ${!dotColor ? 'bg-muted-foreground' : ''}`}
        style={dotColor ? { backgroundColor: dotColor } : {}}
      />
      <span 
        className={`w-2 h-2 rounded-full animate-bounce ${!dotColor ? 'bg-muted-foreground' : ''}`}
        style={dotColor ? { backgroundColor: dotColor } : {}}
      />
    </div>
  );
}
