

# Ny Admin-layout: Top Header + Left Sidebar

## Koncept

Ersätt det nuvarande mönstret (separata Dashboard/Edit/Chat-sidor med sidebar-byte) med en enhetlig admin-layout:

```text
┌──────────────────────────────────────────────────────────────────┐
│  TOP HEADER BAR (slim)                                            │
│  [Dashboard]  [Chat A]  [Chat B]  [+ New]           [user@email] │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                       │
│  LEFT    │  MAIN CONTENT                                         │
│  SIDEBAR │                                                       │
│          │  Dashboard view: Chat cards grid                      │
│  Admin   │  Chat A view: Full chat interface (100% fidelity)     │
│  links:  │  Settings view: Chat/Design/Settings forms            │
│          │                                                       │
│  When "Dashboard":                                               │
│  • Overview    │                                                  │
│  • Analytics   │                                                  │
│  • Settings    │                                                  │
│                │                                                  │
│  When "Chat A":│                                                  │
│  • Chat ←→     │  (full chat UI, pixel-perfect)                  │
│  • Design      │                                                  │
│  • Settings    │                                                  │
│  • Sessions    │                                                  │
│                │                                                  │
└──────────┴───────────────────────────────────────────────────────┘
```

## Nyckelprinciper

1. **Top header** - Alltid synlig. Innehåller: "Dashboard"-länk + en tab per chat instance ("Chat A", "Chat B"...) + "New Chat"-knapp + user menu
2. **Left sidebar** - Kontextuell. Visar admin-länkar baserat på vad som är valt i top header
3. **Main content** - Renderar rätt vy baserat på header-tab + sidebar-val
4. **Chat-vyn** - När sidebar-länken "Chat" är aktiv visas det fullständiga chat-interfacet utan någon admin-overhead (100% fidelity)

## Teknisk plan

### 1. Skapa ny AdminLayout-komponent
**Ny fil: `src/components/AdminLayout.tsx`**

En wrapper-komponent som renderar:
- Slim top header bar med horisontella tabs (Dashboard + varje chat instance)
- Left sidebar med kontextuella admin-länkar
- Main content area

Laddar chat instances från databasen och hanterar navigation via React state (inte URL-routing för tab-switching).

### 2. Skapa AdminTopHeader-komponent
**Ny fil: `src/components/AdminTopHeader.tsx`**

- Smal header (~h-12) med: logo/brand till vänster, horisontella tabs i mitten, user menu till höger
- Tabs: "Dashboard" (alltid), sedan en tab per chat instance med namn
- Overflow-hantering: Om många chattar, visa dropdown "More..." eller scrollbara tabs
- Aktiv tab markeras visuellt

### 3. Skapa AdminSidebar-komponent
**Ny fil: `src/components/AdminSidebar.tsx`**

Kontextuell sidebar som ändrar innehåll baserat på aktiv tab:

**När "Dashboard" är valt:**
- Overview (chat cards grid)
- Account Settings

**När en chat är vald (t.ex. "Chat A"):**
- Chat (öppnar fullständigt chat-interface i main area)
- Design (design-inställningar från nuvarande ChatConfigurationTabs)
- Settings (webhook, slug, typ etc. från nuvarande ChatConfigurationTabs)
- Sessions (konversationshistorik)

### 4. Refaktorera Dashboard-sidan
**Ändra: `src/pages/Dashboard.tsx`**

Wrappa i `AdminLayout` istället för egen `SidebarProvider` + `AppSidebar`. Dashboard-innehållet (chat cards grid) blir en child-komponent som renderas i main content area.

### 5. Integrera ChatConfiguration i AdminLayout
**Ändra: `src/pages/ChatConfiguration.tsx`**

Istället för en separat sida med egen sidebar, renderas edit-formuläret direkt i AdminLayout:s main content area när sidebar-länken "Design" eller "Settings" är aktiv. Live preview tas bort (admin klickar på "Chat"-tabben i sidebar istället).

### 6. Integrera Chat-vyn i AdminLayout (owner mode)
**Ändra: `src/pages/Chat.tsx`**

När owner öppnar en chat från AdminLayout, renderas det fullständiga chat-interfacet i main content area. Sidebar kollapsar automatiskt eller visar sessions-listan.

### 7. Uppdatera routing
**Ändra: `src/App.tsx`**

Konsolidera admin-routes:
- `/dashboard` → AdminLayout med Dashboard-vy
- `/dashboard/chat/:id` → AdminLayout med Chat-vy (owner)
- `/dashboard/chat/:id/design` → AdminLayout med Design-editor
- `/dashboard/chat/:id/settings` → AdminLayout med Settings-editor
- Behåll `/chat/:id` och `/:id` för publika/visitor-vyer (oförändrade)

### 8. Behåll publika/visitor-vyer oförändrade
Inga ändringar för:
- PublicChat, ChatSidebar, PublicChatSidebar
- Visitor-upplevelsen av authenticated chats
- Alla besökar-vyer förblir pixel-perfect

## Sammanfattning av filer

| Fil | Åtgärd |
|-----|--------|
| `src/components/AdminLayout.tsx` | Ny - wrapper med top header + sidebar + content |
| `src/components/AdminTopHeader.tsx` | Ny - slim top header med chat tabs |
| `src/components/AdminSidebar.tsx` | Ny - kontextuell admin sidebar |
| `src/pages/Dashboard.tsx` | Refaktorera - använd AdminLayout |
| `src/pages/ChatConfiguration.tsx` | Refaktorera - rendera inuti AdminLayout |
| `src/pages/Chat.tsx` | Anpassa owner-vy för AdminLayout |
| `src/App.tsx` | Uppdatera routing |

