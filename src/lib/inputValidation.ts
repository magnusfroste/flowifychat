import { z } from "zod";

/**
 * Input validation schemas for production security
 */

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(10000, "Message must be less than 10,000 characters")
    .transform((s) => s.trim()),
});

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email must be less than 255 characters")
  .transform((s) => s.trim().toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters");

/**
 * Validate message content before sending
 */
export function validateMessage(content: string): {
  success: boolean;
  data?: string;
  error?: string;
} {
  try {
    const result = messageSchema.parse({ content });
    return { success: true, data: result.content };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid message" };
    }
    return { success: false, error: "Validation failed" };
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}
