/**
 * View Component: Typing Indicator
 * Displays animated dots while assistant is typing
 */

export function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center">
      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
    </div>
  );
}
