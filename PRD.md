# ChatFlow - Product Requirements Document

## Document Control
- **Last Updated**: 2025-11-05
- **Version**: 1.0
- **Status**: Active Development

---

## 1. Product Overview

### 1.1 Vision
ChatFlow enables anyone to create embeddable AI chat interfaces powered by their own n8n workflows, with full control over branding, conversation history, and analytics.

### 1.2 Problem Statement
- Developers need custom AI chat interfaces integrated with their automation workflows
- Existing solutions lack flexibility in branding, conversation management, and analytics
- No easy way to embed AI assistants that connect to custom backend logic
- Difficult to track engagement and conversation patterns

### 1.3 Solution
A web application that allows users to:
1. Create multiple chat instances with custom configurations
2. Connect each instance to their n8n workflow via webhook
3. Share chat interfaces via public URLs (slugs)
4. Track conversation sessions and analytics
5. Maintain conversation history across page reloads
6. Customize branding (colors, titles, welcome messages, quick-start prompts)

### 1.4 Target Users
- **Primary**: Developers and workflow automation specialists using n8n
- **Secondary**: Businesses wanting branded AI chat interfaces
- **End Users**: Public users interacting with the chat interfaces

---

## 2. Core Features

### 2.1 Chat Instance Management

#### 2.1.1 Create Chat Instance
- **User Story**: As an admin, I want to create a new chat instance so I can embed it on my website
- **Functionality**:
  - Name the chat instance
  - Provide n8n webhook URL
  - Auto-generate unique slug for public access
  - Set default branding (can be customized later)
- **Acceptance Criteria**:
  - ✅ Slug is unique and URL-safe
  - ✅ Webhook URL is validated (basic format check)
  - ✅ Instance immediately accessible via `/chat/{id}` and `/{slug}`

#### 2.1.2 Edit Chat Instance
- **User Story**: As an admin, I want to edit my chat instance configuration
- **Functionality**:
  - Update name and webhook URL
  - Regenerate slug if needed
  - Toggle active/inactive status
  - Delete instance (with confirmation)
- **Acceptance Criteria**:
  - ✅ Changes reflect immediately in public view
  - ✅ Deletion removes all associated messages and analytics
  - ✅ Cannot create duplicate slugs

#### 2.1.3 Custom Branding
- **User Story**: As an admin, I want to customize my chat's appearance
- **Configuration Options**:
  - **Chat Title**: Header text (e.g., "Customer Support Bot")
  - **Welcome Message**: Initial greeting shown to users
  - **Primary Color**: Main accent color
  - **Accent Color**: Secondary accent color
  - **Avatar URL**: Custom bot avatar image
  - **Quick Start Prompts**: Array of suggested conversation starters
  - **Landing Page Mode**: Toggle between immediate chat vs landing page with prompts
- **Acceptance Criteria**:
  - ✅ Colors applied throughout chat interface
  - ✅ Avatar displayed in message bubbles (if provided)
  - ✅ Welcome message shown on first load
  - ✅ Quick-start prompts clickable and pre-fill input

#### 2.1.4 Analytics Dashboard
- **User Story**: As an admin, I want to see how users engage with my chat
- **Metrics Tracked**:
  - Total views (page loads)
  - Unique views (unique session IDs)
  - Total messages sent
  - Active sessions (unique conversations)
  - Last activity timestamp
- **Views**:
  - Summary cards with key metrics
  - Filterable list of chat instances
  - Per-instance detail view
- **Acceptance Criteria**:
  - ✅ Analytics update in real-time
  - ✅ View events tracked on public page loads
  - ✅ Message events tracked on send

### 2.2 Public Chat Interface

#### 2.2.1 Chat UX Flow
1. **Landing Mode** (if enabled):
   - Centered title and input
   - Quick-start prompts displayed
   - Sends first message → transitions to chat mode
   
2. **Welcome Mode** (if no landing page):
   - Shows welcome message
   - Chat input at bottom
   - Quick-start prompts above input (if configured)
   
3. **Chat Mode** (after first message):
   - Full conversation history
   - Message bubbles (user vs assistant)
   - Scroll-to-bottom button (when scrolled up)
   - Loading indicator during AI response

#### 2.2.2 Message Features
- **Markdown Rendering**: Full markdown support in assistant responses
- **Code Block Highlighting**: Syntax highlighting for code snippets
- **Copy Actions**:
  - Copy entire message
  - Copy individual code blocks
- **Regenerate**: Resend last user message to get new response
- **Streaming Support**: Shows typing indicator, then streams response

#### 2.2.3 Session Persistence
- **User Story**: As a public user, I want my conversations to persist across page reloads
- **Implementation**:
  - Generate unique `sessionId` per chat instance
  - Store in localStorage with key `chat_session:{chatKey}`
  - Load previous messages on page load
  - Maintain session even if user navigates away and returns
- **Acceptance Criteria**:
  - ✅ Messages persist after refresh
  - ✅ New tab/window creates new session
  - ✅ Clearing localStorage creates new session

### 2.3 Conversation History & Sessions

#### 2.3.1 Session Management
- **User Story**: As an admin, I want to view all conversation sessions for my chat instance
- **Functionality**:
  - Collapsible sidebar (owner view only)
  - List of all sessions with:
    - Message preview (first message)
    - Message count
    - Relative timestamp
  - Create new session
  - Switch between sessions
  - Reset current session (clear and start fresh)
- **Acceptance Criteria**:
  - ✅ Sidebar only visible to authenticated owners
  - ✅ Current session highlighted
  - ✅ Clicking session loads its messages
  - ✅ New session creates fresh conversation with new sessionId

#### 2.3.2 Message Storage
- **Database**: All messages stored in `chat_messages` table
- **Fields**: 
  - `chat_instance_id`: Links to parent instance
  - `session_id`: Groups messages into conversations
  - `role`: 'user' or 'assistant'
  - `content`: Message text
  - `created_at`: Timestamp
- **Retrieval**: Load by `chat_instance_id` + `session_id`

### 2.4 Authentication System

#### 2.4.1 Current State (Admin Only)
- **User Story**: As an admin, I need to authenticate to manage my chat instances
- **Flow**:
  - Email/password signup and login
  - Auto-redirect authenticated users to dashboard
  - Protected routes: `/dashboard`
  - Public routes: `/`, `/auth`, `/chat/{id}`, `/{slug}`
- **Implementation**:
  - Supabase Auth with email/password
  - Session management via `supabase.auth.onAuthStateChange`
  - Persistent sessions with localStorage
  - Auto-confirm email (no verification required)

#### 2.4.2 Future State (Phase 2 - See Roadmap)
- Public users can optionally sign in to save their chat sessions
- Sessions persist across devices once claimed
- Users can view history across all chat instances they've used

---

## 3. Technical Architecture

### 3.1 Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: React Router v6
- **State Management**: React hooks (useState, useEffect)
- **HTTP Client**: Fetch API
- **Key Libraries**:
  - `react-markdown` + `remark-gfm` for markdown rendering
  - `react-syntax-highlighter` for code blocks
  - `@supabase/supabase-js` for backend integration
  - `@tanstack/react-query` for data fetching
  - `sonner` + `@radix-ui/react-toast` for notifications

### 3.2 Backend (Lovable Cloud / Supabase)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (email/password)
- **Realtime**: Supabase Realtime (not currently used, available for future)
- **Storage**: localStorage for sessionIds
- **API**: Direct Supabase client queries (no edge functions currently)

### 3.3 Data Models

#### 3.3.1 chat_instances
```sql
id: uuid (PK)
user_id: uuid (FK → auth.users)
name: text
webhook_url: text
slug: text (unique, nullable)
is_active: boolean
custom_branding: jsonb {
  chatTitle: string
  welcomeMessage: string
  primaryColor: string
  accentColor: string
  avatarUrl: string | null
  quickStartPrompts: string[]
  landingPageMode: boolean
}
created_at: timestamp
updated_at: timestamp
```

#### 3.3.2 chat_messages
```sql
id: uuid (PK)
chat_instance_id: uuid (FK → chat_instances)
session_id: text
role: text ('user' | 'assistant')
content: text
created_at: timestamp
```

#### 3.3.3 chat_analytics
```sql
id: uuid (PK)
chat_instance_id: uuid (FK → chat_instances)
session_id: text
event_type: text ('view' | 'message')
metadata: jsonb
created_at: timestamp
```

#### 3.3.4 chat_analytics_summary (View)
```sql
chat_instance_id: uuid
total_views: bigint
unique_views: bigint
total_messages: bigint
active_sessions: bigint
last_activity: timestamp
```

### 3.4 Key Utilities

#### 3.4.1 Session Management (`src/lib/session.ts`)
- `getOrCreateSessionId(chatKey)`: Get or generate sessionId for a chat
- `clearSessionId(chatKey)`: Force new session
- `migrateSessionId(oldKey, newKey)`: Migrate when route param changes
- `getChatKeyFromRouteOrInstance()`: Derive consistent chat key

#### 3.4.2 Slug Utils (`src/lib/slugUtils.ts`)
- URL-safe slug generation from names
- Conflict detection and numbering

#### 3.4.3 Chat Config (`src/lib/chatConfig.ts`)
- Default branding values
- Validation logic

#### 3.4.4 Analytics (`src/lib/analytics.ts`)
- `trackView(chatInstanceId, sessionId)`: Track page views
- `trackMessage(chatInstanceId, sessionId)`: Track message sends

---

## 4. Security & Permissions

### 4.1 Row Level Security (RLS) Policies

#### 4.1.1 chat_instances
```sql
-- SELECT
✅ Users can view their own: auth.uid() = user_id
✅ Anyone can view by slug: slug IS NOT NULL

-- INSERT
✅ Users can create their own: auth.uid() = user_id

-- UPDATE
✅ Users can update their own: auth.uid() = user_id

-- DELETE
✅ Users can delete their own: auth.uid() = user_id
```

#### 4.1.2 chat_messages
```sql
-- SELECT
✅ Anyone can view public (via slug): 
   EXISTS(SELECT 1 FROM chat_instances WHERE id = chat_instance_id AND slug IS NOT NULL)
✅ Users can view their own chat's messages:
   EXISTS(SELECT 1 FROM chat_instances WHERE id = chat_instance_id AND user_id = auth.uid())

-- INSERT
✅ Anyone can insert: true (allows anonymous messaging)

-- UPDATE
❌ No updates allowed

-- DELETE
✅ Users can delete messages from their own chats:
   EXISTS(SELECT 1 FROM chat_instances WHERE id = chat_instance_id AND user_id = auth.uid())
```

#### 4.1.3 chat_analytics
```sql
-- SELECT
✅ Users can view their own chat analytics:
   EXISTS(SELECT 1 FROM chat_instances WHERE id = chat_instance_id AND user_id = auth.uid())

-- INSERT
✅ Anyone can insert: true (allows anonymous tracking)

-- UPDATE / DELETE
❌ Not allowed
```

### 4.2 Data Privacy
- Public chat messages are intentionally public (accessible via slug)
- Analytics track sessions but not personal information
- Owner can delete entire chat instance (cascades to messages/analytics)
- No email or PII stored for public users (anonymous by default)

---

## 5. Design System

### 5.1 Color Scheme
- **Primary**: Blue (`#3b82f6`) - Default chat accent
- **Accent**: Purple (`#8b5cf6`) - Secondary highlights
- **Customizable**: Both colors configurable per instance
- **Semantic Tokens**: Defined in `index.css` and `tailwind.config.ts`

### 5.2 Typography
- **Font Family**: System font stack (Inter, sans-serif)
- **Sizes**: Tailwind utility classes (text-sm, text-base, text-lg, etc.)

### 5.3 Animations
- Fade-in for messages
- Slide-in for sidebar
- Smooth transitions for hover states
- Pulse animation for typing indicator

### 5.4 Component Library
- All UI components from shadcn/ui
- Custom variants for chat-specific needs
- Consistent spacing and padding (4px grid)

---

## 6. User Flows

### 6.1 Admin: Create Chat Instance
1. Navigate to `/dashboard`
2. Click "Create New Chat"
3. Fill form:
   - Name
   - Webhook URL
4. Submit
5. View new instance in dashboard
6. Click instance → opens editor
7. Customize branding (optional)
8. Copy public URL (slug)
9. Embed or share

### 6.2 Public User: Interact with Chat
1. Visit `/{slug}` (public URL)
2. **If landing mode**: See quick-start prompts, click one or type message
3. **If welcome mode**: See welcome message, type in bottom input
4. Send message
5. See typing indicator
6. Receive AI response
7. Continue conversation
8. Refresh page → conversation persists
9. Clear localStorage or new browser → new session

### 6.3 Admin: View Analytics
1. Navigate to `/dashboard`
2. See summary metrics at top
3. Scroll to chat instances list
4. View per-instance metrics:
   - Views
   - Messages
   - Active sessions
5. Click instance → view detailed analytics
6. Access sidebar to browse sessions
7. Click session → view full conversation

---

## 7. Future Roadmap

### 7.1 Phase 2: Enhanced User Management (NEXT PRIORITY)

#### Public User Authentication
**Goal**: Allow public (non-admin) users to optionally sign in and save their chat sessions

**Benefits**:
- Sessions persist across devices
- Users can return to past conversations
- Better engagement and retention
- Foundation for future personalization

**Implementation Plan**:

1. **Database Changes**:
   ```sql
   -- Add nullable user_id to chat_messages
   ALTER TABLE chat_messages ADD COLUMN user_id uuid REFERENCES auth.users(id);
   CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
   
   -- Update RLS policies
   CREATE POLICY "Users can view their own messages"
   ON chat_messages FOR SELECT
   USING (auth.uid() = user_id);
   ```

2. **Session Claiming/Migration**:
   - When user signs in, associate their localStorage sessionIds with their user_id
   - Create utility function `claimAnonymousSessions()`:
     ```typescript
     // After login/signup
     const sessions = getLocalStorageSessionIds();
     for (const sessionId of sessions) {
       await supabase
         .from('chat_messages')
         .update({ user_id: user.id })
         .eq('session_id', sessionId)
         .is('user_id', null);
     }
     ```

3. **UI Updates**:
   - Add "Sign in to save your conversations" banner for anonymous users on public chat pages
   - Show user's conversation history in sidebar (even when accessed via slug)
   - Update ChatSidebar to query user's sessions across all chat instances they've used
   - Add sign-out button in chat header

4. **Auth Flow Enhancement**:
   - Update `/auth` to accept `redirect` query parameter
   - After successful login, redirect back to original chat
   - Automatically trigger session claiming

**User Experience**:
- Anonymous users can chat without signing in (current behavior maintained)
- Signed-in users see sidebar with their conversation history
- Sessions persist across devices and browsers once claimed
- Users can start anonymous, then sign in later to claim their session

**Acceptance Criteria**:
- ✅ Anonymous users can continue using chat without authentication
- ✅ Sign-in prompt appears for anonymous users (subtle, non-intrusive)
- ✅ Login/signup flow redirects back to chat
- ✅ Previous anonymous messages are claimed after sign-in
- ✅ Sidebar shows user's sessions when authenticated
- ✅ RLS policies prevent users from accessing others' messages
- ✅ Session claiming only affects current chat instance

### 7.2 Phase 3: Advanced Features
- **Avatar Support**: Upload and display user avatars
- **File Attachments**: Allow users to upload files in chat
- **Voice Input**: Speech-to-text for messages
- **Rich Media**: Image/video rendering in responses
- **Conversation Export**: Download chat history as PDF/TXT
- **Message Reactions**: Thumbs up/down for feedback
- **AI Model Selection**: Let admins choose which AI model to use

### 7.3 Phase 4: Enterprise Features
- **Team Workspaces**: Multiple admins per instance
- **Custom Domains**: White-label chat interfaces
- **SSO Integration**: Enterprise authentication
- **Advanced Analytics**: Funnel analysis, sentiment tracking
- **A/B Testing**: Test different prompts and branding
- **Rate Limiting**: Prevent abuse
- **GDPR Compliance Tools**: Data export, deletion requests

### 7.4 Phase 5: Monetization
- **Free Tier**: 1 chat instance, 1000 messages/month
- **Pro Tier**: Unlimited instances, custom branding, analytics
- **Enterprise Tier**: SSO, custom domains, priority support

---

## 8. Backlog (Prioritized)

### Priority 1 (Phase 2)
1. **Public User Authentication** (detailed above)
   - Nullable user_id in chat_messages
   - Session claiming/migration
   - Sign-in prompt UI
   - User-specific sidebar

2. **Session Naming & Editing**
   - Allow users to rename sessions
   - Store session names in new `chat_sessions` table
   - Display custom names in sidebar

3. **Conversation Search**
   - Search bar in sidebar
   - Full-text search across message content
   - Filter by date range

4. **Delete Individual Sessions**
   - Delete button per session in sidebar
   - Confirmation modal
   - Cascade delete messages

5. **"My Conversations" Page**
   - New route: `/my-conversations`
   - Shows all sessions across all chat instances user has participated in
   - Group by chat instance
   - Click to navigate to session

### Priority 2 (Phase 3)
6. **Webhook Response Validation**
   - Validate n8n response format
   - Better error handling
   - Retry logic with exponential backoff

7. **Code Block Language Detection**
   - Auto-detect programming language
   - Show language label on code blocks
   - Better syntax highlighting

8. **Message Threading**
   - Quote/reply to specific messages
   - Visual threading indicators

9. **Export Conversations**
   - Download as JSON/TXT/PDF
   - Include metadata (timestamps, session ID)

### Priority 3 (Phase 4)
10. **Custom Domains**
11. **Team Workspaces**
12. **Advanced Analytics Dashboard**
13. **Rate Limiting**

---

## 9. Success Metrics

### 9.1 Activation
- % of signed-up users who create at least one chat instance
- Time to first chat instance creation

### 9.2 Engagement
- Average messages per session
- Average session duration
- Return user rate (users who create 2+ instances)

### 9.3 Retention
- D1, D7, D30 retention rates
- Churn rate
- Feature adoption (% using custom branding, analytics, etc.)

### 9.4 Technical Health
- API response times
- Error rates
- Uptime (target: 99.9%)

---

## 10. Development Principles

1. **Separation of Concerns**: Clean separation of data, model, and view
2. **Type Safety**: Strict TypeScript, no `any` types
3. **Component Reusability**: Small, focused components
4. **Performance**: Lazy loading, code splitting, optimized queries
5. **Accessibility**: ARIA labels, keyboard navigation, screen reader support
6. **Security**: RLS policies, input validation, XSS prevention
7. **Testing**: (Future) Unit tests for utilities, integration tests for flows
8. **Documentation**: Inline comments, JSDoc for complex functions

---

## 11. Current Status

### Completed Features ✅
- ✅ User authentication (admin only)
- ✅ Dashboard with chat instance list
- ✅ Create/edit/delete chat instances
- ✅ Custom branding configuration
- ✅ Public chat interface (via slug)
- ✅ Session persistence (localStorage)
- ✅ Conversation history sidebar (owner view)
- ✅ Analytics tracking and dashboard
- ✅ Markdown + code highlighting
- ✅ Copy message/code actions
- ✅ Regenerate response
- ✅ Quick-start prompts
- ✅ Landing page mode
- ✅ Streaming response support (typing indicator)
- ✅ Mobile responsive design

### In Progress 🚧
- None (ready for Phase 2)

### Planned 📋
- Public user authentication (Phase 2)
- Session naming/editing
- Conversation search
- Delete individual sessions
- "My Conversations" page
- Advanced features (Phase 3+)

---

## 12. Technical Dependencies

### External Services
- **n8n Workflow**: Must expose webhook endpoint that:
  - Accepts POST requests with `{ message: string, sessionId: string, chatInstanceId: string }`
  - Returns `{ response: string }` or streams response
  - Handles conversation memory/context

### Browser Requirements
- Modern browser with localStorage support
- JavaScript enabled
- WebSocket support (for future realtime features)

### Lovable Cloud / Supabase
- PostgreSQL database
- Authentication service
- (Future) Storage for file uploads
- (Future) Edge functions for server-side logic

---

## 13. Support & Documentation

### User Documentation (Planned)
- Getting started guide
- n8n webhook setup tutorial
- Branding customization guide
- Analytics interpretation
- Troubleshooting common issues

### Developer Documentation (Planned)
- Architecture overview
- Database schema reference
- API documentation
- Contributing guidelines
- Deployment instructions

---

## 14. Definition of Done

For any feature to be considered complete, it must meet:
1. ✅ Functional requirements implemented
2. ✅ UI/UX matches design system
3. ✅ TypeScript types defined
4. ✅ RLS policies configured (if database changes)
5. ✅ Mobile responsive
6. ✅ Accessible (keyboard nav, ARIA labels)
7. ✅ Error handling implemented
8. ✅ Loading states implemented
9. ✅ Tested manually in dev environment
10. ✅ No console errors or warnings

---

## Appendix: Phase 2 Detailed Technical Design

### A. Database Migration (Public User Auth)

```sql
-- Step 1: Add user_id to chat_messages
ALTER TABLE chat_messages ADD COLUMN user_id uuid REFERENCES auth.users(id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);

-- Step 2: Update RLS policies
CREATE POLICY "Users can view their own messages"
ON chat_messages FOR SELECT
USING (auth.uid() = user_id);

-- Step 3: Create chat_sessions table (for future session naming)
CREATE TABLE chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_instance_id uuid REFERENCES chat_instances(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(session_id, chat_instance_id)
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
ON chat_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
ON chat_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON chat_sessions FOR UPDATE
USING (auth.uid() = user_id);
```

### B. Session Claiming Implementation

```typescript
// src/lib/sessionClaiming.ts

export const claimAnonymousSessions = async (userId: string) => {
  // Get all sessionIds from localStorage
  const sessionIds: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('chat_session:')) {
      const sessionId = localStorage.getItem(key);
      if (sessionId) sessionIds.push(sessionId);
    }
  }

  if (sessionIds.length === 0) return;

  // Update all messages with these sessionIds
  const { error } = await supabase
    .from('chat_messages')
    .update({ user_id: userId })
    .in('session_id', sessionIds)
    .is('user_id', null);

  if (error) {
    console.error('Failed to claim sessions:', error);
    throw error;
  }

  console.log(`Claimed ${sessionIds.length} anonymous sessions`);
};
```

### C. UI Component Changes

```typescript
// New component: SignInPrompt.tsx
export function SignInPrompt({ chatSlug }: { chatSlug: string }) {
  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="p-4 shadow-lg">
        <p className="text-sm text-muted-foreground mb-2">
          Save your conversations across devices
        </p>
        <Button asChild size="sm">
          <Link to={`/auth?redirect=/${chatSlug}`}>
            Sign In
          </Link>
        </Button>
      </Card>
    </div>
  );
}

// Update Chat.tsx to show prompt for anonymous users
{!isOwner && !user && (
  <SignInPrompt chatSlug={chatInstance.slug} />
)}
```

---

**End of Document**
